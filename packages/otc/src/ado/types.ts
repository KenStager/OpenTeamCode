/**
 * Azure DevOps type definitions
 * Based on Azure DevOps REST API v7.1
 */

// Git repository reference
export interface GitRepositoryRef {
  id: string
  name: string
  url: string
  project: {
    id: string
    name: string
  }
}

// Identity reference (user)
export interface IdentityRef {
  id: string
  displayName: string
  uniqueName: string
  url: string
  imageUrl?: string
}

// Git commit reference
export interface GitCommitRef {
  commitId: string
  comment: string
  author: IdentityRef
  committer: IdentityRef
  url: string
}

// Pull request status
export type PullRequestStatus = "active" | "abandoned" | "completed" | "all"

// Pull request merge status
export type PullRequestMergeStatus =
  | "notSet"
  | "queued"
  | "conflicts"
  | "succeeded"
  | "rejectedByPolicy"
  | "failure"

// Git pull request
export interface GitPullRequest {
  pullRequestId: number
  codeReviewId: number
  status: PullRequestStatus
  createdBy: IdentityRef
  creationDate: string
  title: string
  description?: string
  sourceRefName: string
  targetRefName: string
  mergeStatus: PullRequestMergeStatus
  mergeId?: string
  lastMergeSourceCommit?: GitCommitRef
  lastMergeTargetCommit?: GitCommitRef
  lastMergeCommit?: GitCommitRef
  reviewers: IdentityRefWithVote[]
  url: string
  repository: GitRepositoryRef
  supportsIterations: boolean
  isDraft: boolean
  labels?: WebApiTagDefinition[]
}

// Reviewer with vote
export interface IdentityRefWithVote extends IdentityRef {
  vote: number // -10: Rejected, -5: Waiting, 0: No vote, 5: Approved with suggestions, 10: Approved
  isRequired?: boolean
  isFlagged?: boolean
}

// Label/tag definition
export interface WebApiTagDefinition {
  id: string
  name: string
  active: boolean
}

// Pull request thread/comment
export interface CommentThread {
  id: number
  publishedDate: string
  lastUpdatedDate: string
  comments: Comment[]
  status: CommentThreadStatus
  threadContext?: CommentThreadContext
  properties?: Record<string, unknown>
  isDeleted: boolean
}

export type CommentThreadStatus =
  | "unknown"
  | "active"
  | "fixed"
  | "wontFix"
  | "closed"
  | "byDesign"
  | "pending"

export interface CommentThreadContext {
  filePath: string
  rightFileStart?: CommentPosition
  rightFileEnd?: CommentPosition
  leftFileStart?: CommentPosition
  leftFileEnd?: CommentPosition
}

export interface CommentPosition {
  line: number
  offset: number
}

export interface Comment {
  id: number
  parentCommentId: number
  author: IdentityRef
  content: string
  publishedDate: string
  lastUpdatedDate: string
  lastContentUpdatedDate: string
  commentType: "text" | "codeChange" | "system"
  isDeleted: boolean
}

// Pull request iteration (each push creates a new iteration)
export interface GitPullRequestIteration {
  id: number
  description?: string
  author: IdentityRef
  createdDate: string
  updatedDate: string
  sourceRefCommit: GitCommitRef
  targetRefCommit: GitCommitRef
  commonRefCommit: GitCommitRef
  hasMoreCommits: boolean
  reason: string
}

// Change entry in a pull request
export interface GitPullRequestChange {
  changeId: number
  changeTrackingId: number
  item: GitItem
  changeType: VersionControlChangeType
  originalPath?: string
}

export type VersionControlChangeType =
  | "none"
  | "add"
  | "edit"
  | "encoding"
  | "rename"
  | "delete"
  | "undelete"
  | "branch"
  | "merge"
  | "lock"
  | "rollback"
  | "sourceRename"
  | "targetRename"
  | "property"
  | "all"

export interface GitItem {
  objectId: string
  originalObjectId?: string
  gitObjectType: "blob" | "tree" | "commit" | "tag"
  commitId: string
  path: string
  isFolder: boolean
  url: string
}

// File diff
export interface FileDiff {
  originalPath?: string
  modifiedPath?: string
  originalFile?: DiffFileInfo
  modifiedFile?: DiffFileInfo
  blocks: FileDiffBlock[]
}

export interface DiffFileInfo {
  content?: string
  objectId?: string
}

export interface FileDiffBlock {
  changeType: "add" | "delete" | "edit"
  originalStartLine: number
  originalLineCount: number
  modifiedStartLine: number
  modifiedLineCount: number
  lines?: string[]
}

// Request/response types for creating threads
export interface CreateThreadRequest {
  comments: CreateCommentRequest[]
  status?: CommentThreadStatus
  threadContext?: CommentThreadContext
  properties?: Record<string, { type: string; value: unknown }>
}

export interface CreateCommentRequest {
  parentCommentId?: number
  content: string
  commentType?: "text" | "codeChange" | "system"
}

// Update PR request
export interface UpdatePullRequestRequest {
  title?: string
  description?: string
  status?: PullRequestStatus
  targetRefName?: string
  autoCompleteSetBy?: IdentityRef
  completionOptions?: {
    deleteSourceBranch?: boolean
    squashMerge?: boolean
    mergeCommitMessage?: string
  }
}

// Add label request
export interface AddLabelRequest {
  name: string
}

// API response wrapper
export interface ApiResponse<T> {
  value: T
  count: number
}

// Error response
export interface AdoError {
  $id: string
  innerException?: AdoError
  message: string
  typeName: string
  typeKey: string
  errorCode: number
}
