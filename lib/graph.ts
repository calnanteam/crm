import { Client } from "@microsoft/microsoft-graph-client";
import "isomorphic-fetch";

export interface Email {
  id: string;
  conversationId: string;
  subject: string;
  sender: {
    name: string;
    address: string;
  };
  receivedDateTime: string;
  bodyPreview: string;
  body: {
    content: string;
    contentType: string;
  };
  isRead: boolean;
  toRecipients?: Array<{
    emailAddress: {
      name: string;
      address: string;
    };
  }>;
  ccRecipients?: Array<{
    emailAddress: {
      name: string;
      address: string;
    };
  }>;
  bccRecipients?: Array<{
    emailAddress: {
      name: string;
      address: string;
    };
  }>;
}

export interface SendReplyParams {
  emailId: string;
  replyText: string;
  isHtml?: boolean;
}

/**
 * Token cache for app-only authentication
 */
let cachedToken: {
  accessToken: string;
  expiresAt: number;
} | null = null;

/**
 * Gets an app-only access token using client credentials flow
 * Implements token caching to avoid unnecessary token requests
 */
async function getAppAccessToken(): Promise<string> {
  // Return cached token if still valid (with 5-minute buffer)
  if (cachedToken && cachedToken.expiresAt > Date.now() + 5 * 60 * 1000) {
    return cachedToken.accessToken;
  }

  const clientId = process.env.AZURE_AD_CLIENT_ID;
  const clientSecret = process.env.AZURE_AD_CLIENT_SECRET;
  const tenantId = process.env.AZURE_AD_TENANT_ID;

  if (!clientId || !clientSecret || !tenantId) {
    throw new Error("Missing Azure AD credentials in environment variables");
  }

  const tokenEndpoint = `https://login.microsoftonline.com/${tenantId}/oauth2/v2.0/token`;
  
  const params = new URLSearchParams({
    client_id: clientId,
    client_secret: clientSecret,
    scope: "https://graph.microsoft.com/.default",
    grant_type: "client_credentials",
  });

  try {
    const response = await fetch(tokenEndpoint, {
      method: "POST",
      headers: {
        "Content-Type": "application/x-www-form-urlencoded",
      },
      body: params.toString(),
    });

    if (!response.ok) {
      const errorText = await response.text();
      throw new Error(`Failed to get access token: ${response.status} ${errorText}`);
    }

    const data = await response.json();
    
    // Cache the token
    cachedToken = {
      accessToken: data.access_token,
      expiresAt: Date.now() + (data.expires_in * 1000),
    };

    return data.access_token;
  } catch (error: any) {
    console.error("Error getting app access token:", error);
    throw new Error(`Failed to authenticate with Microsoft Graph: ${error.message}`);
  }
}

/**
 * Creates a Microsoft Graph API client with app-only authentication
 */
async function getGraphClient(): Promise<Client> {
  const accessToken = await getAppAccessToken();
  
  return Client.init({
    authProvider: (done) => {
      done(null, accessToken);
    },
  });
}

/**
 * Gets the mailbox UPN from environment variables
 */
function getMailboxUPN(): string {
  const upn = process.env.GRAPH_MAILBOX_UPN;
  
  if (!upn) {
    throw new Error("GRAPH_MAILBOX_UPN environment variable is not set");
  }
  
  return upn;
}

/**
 * Gets the current user's email address (mailbox UPN)
 * This is used for recipient context determination
 */
export function getCurrentUserEmail(): string {
  return getMailboxUPN();
}

/**
 * Checks if an email should be excluded based on sender or subject
 */
function shouldExcludeEmail(email: any): boolean {
  const senderAddress = email.from?.emailAddress?.address?.toLowerCase() || "";
  const subject = email.subject?.toLowerCase() || "";
  
  // Exclude if sender contains no-reply patterns
  const noReplyPatterns = [
    "noreply",
    "no-reply",
    "donotreply",
    "do-not-reply",
  ];
  
  if (noReplyPatterns.some(pattern => senderAddress.includes(pattern))) {
    return true;
  }
  
  // Exclude if subject contains newsletter/unsubscribe patterns
  const excludeSubjectPatterns = [
    "unsubscribe",
    "newsletter",
    "digest",
  ];
  
  if (excludeSubjectPatterns.some(pattern => subject.includes(pattern))) {
    return true;
  }
  
  return false;
}

/**
 * Response structure for paginated email fetching
 */
export interface FetchEmailsResponse {
  emails: Email[];
  nextPageToken?: string;
}

/**
 * Fetches unread emails from the last 7 days using app-only authentication
 * Applies exclusion rules and supports pagination
 * 
 * @param pageSize - Number of emails to fetch per page (default: 50, max: 50)
 * @param skipToken - Optional token for fetching next page
 */
export async function fetchUnreadEmails(pageSize: number = 50, skipToken?: string): Promise<FetchEmailsResponse> {
  const client = await getGraphClient();
  const upn = getMailboxUPN();
  
  // Calculate date 7 days ago
  const sevenDaysAgo = new Date();
  sevenDaysAgo.setDate(sevenDaysAgo.getDate() - 7);
  const dateFilter = sevenDaysAgo.toISOString();
  
  // Clamp page size to reasonable limits
  const clampedPageSize = Math.min(Math.max(pageSize, 1), 50);
  
  try {
    let query = client
      .api(`/users/${upn}/mailFolders/inbox/messages`)
      .filter(`isRead eq false and receivedDateTime ge ${dateFilter}`)
      .orderby("receivedDateTime desc")
      .top(clampedPageSize)
      .select([
        "id",
        "conversationId",
        "subject",
        "from",
        "toRecipients",
        "ccRecipients",
        "bccRecipients",
        "receivedDateTime",
        "bodyPreview",
        "body",
        "isRead",
      ]);
    
    // If skipToken is provided, append it to the query
    if (skipToken) {
      query = query.skipToken(skipToken);
    }
    
    const response = await query.get();
    
    const emails = response.value || [];
    
    // Filter out excluded emails
    const filteredEmails = emails
      .filter((email: any) => !shouldExcludeEmail(email))
      .map((email: any) => ({
        id: email.id,
        conversationId: email.conversationId,
        subject: email.subject || "(No Subject)",
        sender: {
          name: email.from?.emailAddress?.name || "Unknown Sender",
          address: email.from?.emailAddress?.address || "",
        },
        receivedDateTime: email.receivedDateTime,
        bodyPreview: email.bodyPreview || "",
        body: {
          content: email.body?.content || "",
          contentType: email.body?.contentType || "text",
        },
        isRead: email.isRead || false,
        toRecipients: email.toRecipients || [],
        ccRecipients: email.ccRecipients || [],
        bccRecipients: email.bccRecipients || [],
      }));
    
    // Extract next page token from @odata.nextLink if present
    let nextPageToken: string | undefined = undefined;
    if (response["@odata.nextLink"]) {
      // Extract skiptoken from the nextLink URL
      const nextLink = response["@odata.nextLink"];
      const skipTokenMatch = nextLink.match(/[\?&]skiptoken=([^&]+)/);
      if (skipTokenMatch && skipTokenMatch[1]) {
        nextPageToken = decodeURIComponent(skipTokenMatch[1]);
      }
    }
    
    return {
      emails: filteredEmails,
      nextPageToken,
    };
  } catch (error: any) {
    console.error("Error fetching emails:", error);
    throw new Error(`Failed to fetch emails: ${error.message}`);
  }
}

/**
 * Converts plain text to HTML with proper spacing for Outlook
 * Avoids <p> tags which add extra margins in Outlook
 * Preserves single newlines as <br> and blank lines as <br><br>
 */
function convertTextToHtml(text: string): string {
  // Escape HTML to prevent injection
  const escapedText = escapeHtml(text);
  
  // Replace newlines with <br> tags
  // Two consecutive newlines (blank line) become <br><br>
  const htmlContent = escapedText.replace(/\n/g, '<br>');
  
  // Wrap in a div with styles that preserve whitespace predictably
  // This ensures consistent rendering across Outlook and other clients
  return `<div style="white-space: pre-wrap; font-family: inherit; font-size: inherit;">${htmlContent}</div>`;
}

/**
 * Escapes HTML special characters to prevent injection
 */
function escapeHtml(text: string): string {
  const map: { [key: string]: string } = {
    '&': '&amp;',
    '<': '&lt;',
    '>': '&gt;',
    '"': '&quot;',
    "'": '&#039;',
  };
  return text.replace(/[&<>"']/g, (char) => map[char]);
}

/**
 * Sends a reply to an email using app-only authentication
 */
export async function sendReply(params: SendReplyParams): Promise<void> {
  const client = await getGraphClient();
  const upn = getMailboxUPN();
  const { emailId, replyText, isHtml = true } = params;
  
  try {
    // Convert plain text to HTML to preserve formatting and enable signature
    const htmlContent = convertTextToHtml(replyText);
    
    await client
      .api(`/users/${upn}/messages/${emailId}/reply`)
      .post({
        message: {
          body: {
            contentType: 'HTML',
            content: htmlContent,
          },
        },
      });
  } catch (error: any) {
    console.error("Error sending reply:", error);
    throw new Error(`Failed to send reply: ${error.message}`);
  }
}

/**
 * Sends a reply-all to an email using app-only authentication
 */
export async function sendReplyAll(params: SendReplyParams): Promise<void> {
  const client = await getGraphClient();
  const upn = getMailboxUPN();
  const { emailId, replyText, isHtml = true } = params;
  
  try {
    // Convert plain text to HTML to preserve formatting and enable signature
    const htmlContent = convertTextToHtml(replyText);
    
    await client
      .api(`/users/${upn}/messages/${emailId}/replyAll`)
      .post({
        message: {
          body: {
            contentType: 'HTML',
            content: htmlContent,
          },
        },
      });
  } catch (error: any) {
    console.error("Error sending reply all:", error);
    throw new Error(`Failed to send reply all: ${error.message}`);
  }
}

export interface SendForwardParams {
  emailId: string;
  forwardText: string;
  toRecipients: string[]; // Array of email addresses
  isHtml?: boolean;
}

/**
 * Forwards an email using app-only authentication
 */
export async function sendForward(params: SendForwardParams): Promise<void> {
  const client = await getGraphClient();
  const upn = getMailboxUPN();
  const { emailId, forwardText, toRecipients, isHtml = true } = params;
  
  try {
    // Convert plain text to HTML to preserve formatting
    const htmlContent = convertTextToHtml(forwardText);
    
    // Build recipient objects for Graph API
    const recipients = toRecipients.map(email => ({
      emailAddress: {
        address: email.trim(),
      },
    }));
    
    await client
      .api(`/users/${upn}/messages/${emailId}/forward`)
      .post({
        message: {
          body: {
            contentType: 'HTML',
            content: htmlContent,
          },
        },
        toRecipients: recipients,
      });
  } catch (error: any) {
    console.error("Error forwarding email:", error);
    throw new Error(`Failed to forward email: ${error.message}`);
  }
}

/**
 * Marks an email as read using app-only authentication
 */
export async function markAsRead(emailId: string): Promise<void> {
  const client = await getGraphClient();
  const upn = getMailboxUPN();
  
  try {
    await client
      .api(`/users/${upn}/messages/${emailId}`)
      .patch({
        isRead: true,
      });
  } catch (error: any) {
    console.error("Error marking email as read:", error);
    throw new Error(`Failed to mark email as read: ${error.message}`);
  }
}

/**
 * Gets a single email by ID using app-only authentication
 */
export async function getEmailById(emailId: string): Promise<Email> {
  const client = await getGraphClient();
  const upn = getMailboxUPN();
  
  try {
    const email = await client
      .api(`/users/${upn}/messages/${emailId}`)
      .select([
        "id",
        "conversationId",
        "subject",
        "from",
        "toRecipients",
        "ccRecipients",
        "bccRecipients",
        "receivedDateTime",
        "bodyPreview",
        "body",
        "isRead",
      ])
      .get();
    
    return {
      id: email.id,
      conversationId: email.conversationId,
      subject: email.subject || "(No Subject)",
      sender: {
        name: email.from?.emailAddress?.name || "Unknown Sender",
        address: email.from?.emailAddress?.address || "",
      },
      receivedDateTime: email.receivedDateTime,
      bodyPreview: email.bodyPreview || "",
      body: {
        content: email.body?.content || "",
        contentType: email.body?.contentType || "text",
      },
      isRead: email.isRead || false,
      toRecipients: email.toRecipients || [],
      ccRecipients: email.ccRecipients || [],
      bccRecipients: email.bccRecipients || [],
    };
  } catch (error: any) {
    console.error("Error fetching email:", error);
    throw new Error(`Failed to fetch email: ${error.message}`);
  }
}

/**
 * Gets the actual unread count from the Inbox folder metadata
 * This returns the true unread count from the mailbox, not filtered by date or limited by top N
 */
export async function getInboxUnreadCount(): Promise<number> {
  const client = await getGraphClient();
  const upn = getMailboxUPN();
  
  try {
    const response = await client
      .api(`/users/${upn}/mailFolders/inbox`)
      .select(["unreadItemCount"])
      .get();
    
    return response.unreadItemCount || 0;
  } catch (error: any) {
    console.error("Error fetching inbox unread count:", error);
    throw new Error(`Failed to fetch inbox unread count: ${error.message}`);
  }
}

/**
 * Deletes an email using app-only authentication
 * This permanently deletes the email from the mailbox
 */
export async function deleteEmail(emailId: string): Promise<void> {
  const client = await getGraphClient();
  const upn = getMailboxUPN();
  
  try {
    await client
      .api(`/users/${upn}/messages/${emailId}`)
      .delete();
  } catch (error: any) {
    console.error("Error deleting email:", error);
    throw new Error(`Failed to delete email: ${error.message}`);
  }
}

/**
 * Default limit for fetching conversation messages
 */
const DEFAULT_CONVERSATION_MESSAGE_LIMIT = 10;

/**
 * Fetches messages in a conversation/thread using conversationId
 * Returns messages sorted oldest to newest
 * 
 * @param conversationId - The conversation ID to fetch messages for
 * @param limit - Maximum number of messages to return (default: 10, max: 15)
 */
export async function fetchConversationMessages(
  conversationId: string,
  limit: number = DEFAULT_CONVERSATION_MESSAGE_LIMIT
): Promise<Email[]> {
  const client = await getGraphClient();
  const upn = getMailboxUPN();
  
  // Clamp limit to reasonable range
  const clampedLimit = Math.min(Math.max(limit, 1), 15);
  
  // Escape single quotes in conversationId to prevent OData injection
  const escapedConversationId = conversationId.replace(/'/g, "''");
  
  try {
    const response = await client
      .api(`/users/${upn}/messages`)
      .filter(`conversationId eq '${escapedConversationId}'`)
      .orderby("receivedDateTime asc")
      .top(clampedLimit)
      .select([
        "id",
        "subject",
        "from",
        "toRecipients",
        "ccRecipients",
        "receivedDateTime",
        "body",
        "isRead",
      ])
      .get();
    
    const messages = response.value || [];
    
    return messages.map((msg: any) => ({
      id: msg.id,
      conversationId,
      subject: msg.subject || "(No Subject)",
      sender: {
        name: msg.from?.emailAddress?.name || "Unknown Sender",
        address: msg.from?.emailAddress?.address || "",
      },
      receivedDateTime: msg.receivedDateTime,
      bodyPreview: "",
      body: {
        content: msg.body?.content || "",
        contentType: msg.body?.contentType || "text",
      },
      isRead: msg.isRead ?? true,
      toRecipients: msg.toRecipients || [],
      ccRecipients: msg.ccRecipients || [],
    }));
  } catch (error: any) {
    console.error("Error fetching conversation messages:", error);
    throw new Error(`Failed to fetch conversation messages: ${error.message}`);
  }
}

export interface MailFolder {
  id: string;
  displayName: string;
  parentFolderId?: string;
  childFolderCount?: number;
  unreadItemCount?: number;
  totalItemCount?: number;
}

/**
 * Fetches mail folders for the user's mailbox
 */
export async function getMailFolders(): Promise<MailFolder[]> {
  const client = await getGraphClient();
  const upn = getMailboxUPN();
  
  try {
    const response = await client
      .api(`/users/${upn}/mailFolders`)
      .select(['id', 'displayName', 'parentFolderId', 'childFolderCount', 'unreadItemCount', 'totalItemCount'])
      .get();
    
    const folders = response.value || [];
    
    return folders.map((folder: any) => ({
      id: folder.id,
      displayName: folder.displayName || "Unknown Folder",
      parentFolderId: folder.parentFolderId,
      childFolderCount: folder.childFolderCount || 0,
      unreadItemCount: folder.unreadItemCount || 0,
      totalItemCount: folder.totalItemCount || 0,
    }));
  } catch (error: any) {
    console.error("Error fetching mail folders:", error);
    throw new Error(`Failed to fetch mail folders: ${error.message}`);
  }
}

/**
 * Moves an email to a specified folder
 */
export async function moveEmail(emailId: string, destinationFolderId: string): Promise<void> {
  const client = await getGraphClient();
  const upn = getMailboxUPN();
  
  try {
    await client
      .api(`/users/${upn}/messages/${emailId}/move`)
      .post({
        destinationId: destinationFolderId,
      });
  } catch (error: any) {
    console.error("Error moving email:", error);
    throw new Error(`Failed to move email: ${error.message}`);
  }
}
