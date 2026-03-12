import { getDocsClient, getDriveClient, isDocsConfigured } from '../utils/googleAuth.js';
import { toolSuccess, toolError, toolEmpty } from '../utils/toolResponse.js';
import { safeTitle } from '../utils/helpers.js';
import { listDriveFilesByMimeType } from '../utils/driveUtils.js';
import { getContext } from '../auth/requestContext.js';
import { AGENT_MAX_DOC_CHARS } from '../config/index.js';

const DOCS_MIME_TYPE = 'application/vnd.google-apps.document';

export { isDocsConfigured };

/**
 * Build document URL from documentId.
 * @param {string} documentId
 * @returns {string}
 */
function documentUrl(documentId) {
  return `https://docs.google.com/document/d/${documentId}/edit`;
}

/**
 * Extract plain text from Docs API document content (structural elements).
 * @param {object} doc - documents.get response body
 * @returns {string}
 */
function extractTextFromDocument(doc) {
  const content = doc.body?.content;
  if (!Array.isArray(content)) return '';
  const parts = [];
  for (const el of content) {
    if (el.paragraph?.elements) {
      for (const run of el.paragraph.elements) {
        if (run.textRun?.content) parts.push(run.textRun.content);
      }
    }
  }
  return parts.join('').trim();
}

export const create_document = async ({ title, body }) => {
  if (!isDocsConfigured()) {
    return toolError(
      'Docs credentials not configured. Add Docs and Drive scopes to OAuth (documents, drive.readonly).',
      { setup: 'Re-authorize with Google so the app can create documents.' }
    );
  }
  if (!title || !String(title).trim()) {
    return toolError('title is required.');
  }
  try {
    const docs = getDocsClient();
    const createRes = await docs.documents.create({
      requestBody: { title: safeTitle(title, 'Untitled') },
    });
    const documentId = createRes.data.documentId;
    if (!documentId) {
      return toolError('Docs API did not return a document ID.');
    }
    if (body != null && String(body).trim()) {
      await docs.documents.batchUpdate({
        documentId,
        requestBody: {
          requests: [
            {
              insertText: {
                text: String(body).trim(),
                location: { index: 1 },
              },
            },
          ],
        },
      });
    }
    const docTitle = createRes.data.title || title;
    return toolSuccess({
      success: true,
      message: `Document "${docTitle}" created successfully.`,
      documentId,
      title: docTitle,
      documentUrl: documentUrl(documentId),
      documents: [{ id: documentId, name: docTitle, documentUrl: documentUrl(documentId), webViewLink: documentUrl(documentId), modifiedTime: new Date().toISOString() }],
    });
  } catch (err) {
    console.error('[create_document] Error:', err.message);
    return toolError(`Failed to create document: ${err.message}`);
  }
};

export const search_documents = async ({ query, maxResults }) => {
  if (!isDocsConfigured()) {
    return toolError(
      'Docs/Drive credentials not configured. Add Docs and Drive read scope to OAuth.',
      { setup: 'Re-authorize with Google so the app can search your documents.' }
    );
  }
  try {
    const drive = getDriveClient();
    const files = await listDriveFilesByMimeType({
      mimeType: DOCS_MIME_TYPE,
      query: query || undefined,
      maxResults,
      driveClient: drive,
    });
    if (files.length === 0) {
      return toolEmpty('No Google Docs found.', { documents: [] });
    }
    return toolSuccess({ count: files.length, documents: files });
  } catch (err) {
    console.error('[search_documents] Error:', err.message);
    return toolError(`Failed to search documents: ${err.message}`);
  }
};

export const get_document = async ({ documentId }) => {
  if (!isDocsConfigured()) {
    return toolError('Docs credentials not configured. Add Docs scope to OAuth.');
  }
  if (!documentId || !String(documentId).trim()) {
    return toolError('documentId is required.');
  }
  try {
    const docs = getDocsClient();
    const res = await docs.documents.get({ documentId: documentId.trim() });
    const title = res.data.title || '(Untitled)';
    const bodyText = extractTextFromDocument(res.data);
    const charCount = (bodyText || '').length;
    const ctx = getContext();
    const allowRead = ctx?.allowAgentReadDocsSheets === true;

    if (allowRead) {
      const text = bodyText || '(No content)';
      if (text.length > AGENT_MAX_DOC_CHARS) {
        const docUrl = documentUrl(res.data.documentId);
        return toolSuccess({
          documentId: res.data.documentId,
          title,
          documentUrl: docUrl,
          message: 'Document exceeds size limit for the agent.',
          replyToUser: `This document is too large for me to read (limit ${AGENT_MAX_DOC_CHARS} characters). You can open the link to view it.\n\n[Open document](${docUrl})`,
        });
      }
      return toolSuccess({
        documentId: res.data.documentId,
        title,
        documentUrl: documentUrl(res.data.documentId),
        bodyText: text,
      });
    }
    const docUrl = documentUrl(res.data.documentId);
    return toolSuccess({
      documentId: res.data.documentId,
      title,
      documentUrl: docUrl,
      message: 'Data privacy is on; document content was not sent to the agent.',
      replyToUser: `Due to data privacy, I am not reading your document. You can open the link to view it. If you wish to change that, go to Settings and turn data privacy off.\n\n[Open document](${docUrl})`,
    });
  } catch (err) {
    console.error('[get_document] Error:', err.message);
    return toolError(`Failed to get document: ${err.message}`);
  }
};
