export interface User {
  _id: string;
  name: string;
  email: string;
  profilePicture?: string;
  createdAt: string;
  updatedAt: string;
}

export type MeetingStatus = 'pending' | 'processing' | 'completed' | 'failed' | 'deleted';

export interface Meeting {
  _id: string;
  user: string;
  title: string;
  date: string;
  status: MeetingStatus;
  keywords: string[];
  tags: string[];
  isDeleted: boolean;
  deletedAt?: string;
  createdAt: string;
  updatedAt: string;
}

export type RecordingType = 'upload' | 'live';

export interface Recording {
  _id: string;
  meeting: string;
  filePath: string;
  cloudinaryPublicId: string;
  duration: number;
  uploadTime: string;
  recordingType: RecordingType;
  fileSize: number;
  mimeType: string;
  originalFileName: string;
  createdAt: string;
  updatedAt: string;
}

export interface Transcript {
  _id: string;
  recording: string;
  transcriptText: string;
  language: string;
  isEdited: boolean;
  editedAt?: string;
  createdAt: string;
  updatedAt: string;
}

export interface Summary {
  _id: string;
  transcript: string;
  summaryText: string;
  meetingOverview: string;
  keyDiscussionPoints: string[];
  importantDecisions: string[];
  nextSteps: string[];
  risks: string[];
  highlights: string[];
  smartTitle: string;
  keywords: string[];
  tags: string[];
  generatedAt: string;
  createdAt: string;
  updatedAt: string;
}

export type ActionItemStatus = 'pending' | 'in-progress' | 'completed';
export type ActionItemPriority = 'low' | 'medium' | 'high';

export interface ActionItem {
  _id: string;
  summary: string;
  task: string;
  status: ActionItemStatus;
  deadline?: string;
  assignee?: string;
  priority: ActionItemPriority;
  createdAt: string;
  updatedAt: string;
}

export interface Notes {
  _id: string;
  summary: string;
  meeting: string;
  noteContent: string;
  shareToken?: string;
  isPublicShare: boolean;
  editedAt: string;
  createdAt: string;
  updatedAt: string;
}

export interface ApiResponse<T> {
  success: boolean;
  message: string;
  data?: T;
  meta?: {
    page?: number;
    limit?: number;
    total?: number;
    totalPages?: number;
    [key: string]: unknown;
  };
}

export interface AuthTokens {
  accessToken: string;
  refreshToken: string;
}

export interface DashboardStats {
  totalMeetings: number;
  totalNotes: number;
  totalSummaries: number;
  totalActionItems: number;
  pendingActionItems: number;
}

export interface MeetingFullDetail {
  meeting: Meeting;
  recording: Recording | null;
  transcript: Transcript | null;
  summary: Summary | null;
  notes: Notes | null;
}
