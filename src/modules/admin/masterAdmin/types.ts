export type Page = 'content' | 'community' | 'feedback' | 'users' | 'admin' | 'login' | 'profile'

export type ManagerRole =
  | 'Master Admin'
  | 'Content Manager'
  | 'Comment Manager'
  | 'Feedback Manager'
  | 'User Manager'
  | 'System Manager'

export type AccountStatus = 'Active' | 'Inactive'

export interface Manager {
  id: string
  name: string
  email: string
  username: string
  role: ManagerRole
  status: AccountStatus
  lastLogin: string | null
  avatarColor: string
}

export type ContentAvailability = 'Available' | 'Unavailable'

export interface ContentItem {
  id: string
  title: string
  category: string
  genres: string[]
  releaseYear: number
  runtime: number
  ageRating: string
  totalStreams: number
  availability: ContentAvailability
  thumbnail: string
}

export interface Category {
  id: string
  name: string
  description: string
  contentCount: number
}

export interface Genre {
  id: string
  name: string
  contentCount: number
}

export interface Soundtrack {
  id: string
  contentId: string
  contentTitle: string
  title: string
  artist: string
  duration: string
}

export interface Review {
  id: string
  subscriberId: string
  subscriberName: string
  contentTitle: string
  rating: number
  text: string
  date: string
}

export interface Reaction {
  id: string
  subscriberId: string
  subscriberName: string
  contentTitle: string
  type: string
  date: string
}

export type PostStatus = 'Active' | 'Hidden' | 'Deleted'

export interface ForumPost {
  id: string
  subscriberId: string
  authorName: string
  title: string
  body: string
  status: PostStatus
  date: string
}

export interface ForumComment {
  id: string
  postId: string
  postTitle: string
  subscriberId: string
  authorName: string
  body: string
  date: string
}

export type FeedbackType = 'Bug Report' | 'Feature Request' | 'Suggestion'
export type FeedbackStatus = 'Open' | 'In Progress' | 'Closed'

export interface FeedbackItem {
  id: string
  subscriberId: string
  type: FeedbackType
  subject: string
  description: string
  screenshot: string | null
  submissionDate: string
  status: FeedbackStatus
}

export type SubscriberStatus = 'Active' | 'Inactive' | 'Banned'

export interface Subscriber {
  id: string
  name: string
  email: string
  username: string
  status: SubscriberStatus
  joinDate: string
  avatarColor: string
}

export interface WatchHistory {
  id: string
  subscriberId: string
  subscriberName: string
  contentTitle: string
  watchDate: string
  progress: number
}

export type SubscriptionStatus = 'Active' | 'Expired' | 'Cancelled'

export interface Subscription {
  id: string
  subscriberId: string
  subscriberName: string
  planName: string
  startDate: string
  endDate: string
  status: SubscriptionStatus
}

export interface Plan {
  id: string
  name: string
  price: string
  duration: string
  features: string[]
}

export type PaymentStatus = 'Pending' | 'Verified' | 'Failed'

export interface Payment {
  id: string
  subscriberId: string
  subscriberName: string
  planName: string
  amount: string
  date: string
  status: PaymentStatus
}
