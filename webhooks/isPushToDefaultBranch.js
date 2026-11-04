/**
 * @typedef {import("@octokit/webhooks/dist-types/index").EmitterWebhookEvent<"push">["payload"]} PushPayload
 */

/**
 * @param {PushPayload} payload
 * @returns {boolean}
 */
export const isPushToDefaultBranch = (payload) =>
  payload.ref === `refs/heads/${payload.repository.default_branch}`;
