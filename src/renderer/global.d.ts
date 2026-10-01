import type { AuthenticatedUser } from "../common/interface/authenticated-user.interface";
import type {
  LoginResult,
  VerifyEmailResult,
} from "../common/interface/auth-results.interface";
import type { User } from "../common/interface/user.interface";

declare global {
  interface Window {
    api: {
      ping: () => Promise<string>;

      auth: {
        login: (
          email: string,
          password: string
        ) => Promise<LoginResult>;

        register: (
          name: string,
          email: string,
          password: string
        ) => Promise<number>;

        verifyEmail: (
          email: string,
          code: string
        ) => Promise<VerifyEmailResult>;

        resendVerification: (email: string) => Promise<void>;

        forgotPassword: (email: string) => Promise<void>;

        resetPassword: (
          email: string,
          code: string,
          password: string
        ) => Promise<void>;

        refresh: () => Promise<boolean>;

        logout: () => Promise<boolean>;
      };

      app: {
        initialize: () => Promise<AuthenticatedUser | null>;
      };

      socket: {
        onOnlineUsers: (
          callback: (data: { userIds: number[] }) => void
        ) => () => void;

        onUserOnline: (
          callback: (data: { userId: number }) => void
        ) => () => void;

        onUserOffline: (
          callback: (data: { userId: number }) => void
        ) => () => void;

        sendMessage: (receiverId: number, content: string) => Promise<void>;

        onNewMessage: (
          callback: (data: {
            senderId: number;
            receiverId: number;
            content: string;
          }) => void
        ) => void;

        callRequest: (receiverId: number) => Promise<void>;

        callAccepted: (receiverId: number) => Promise<void>;

        callRejected: (receiverId: number) => Promise<void>;

        callEnded: (receiverId: number) => Promise<void>;

        onIncomingCall: (
          callback: (data: { callerId: number }) => void
        ) => () => void;

        onCallAccepted: (
          callback: (data: { receiverId: number }) => void
        ) => () => void;

        onCallRejected: (
          callback: (data: { receiverId: number }) => void
        ) => () => void;

        onCallEnded: (
          callback: (data: { userId: number }) => void
        ) => () => void;

        // WebRTC

        sendWebRTCOffer: (
          receiverId: number,
          offer: RTCSessionDescriptionInit
        ) => Promise<void>;

        onWebRTCOffer: (
          callback: (data: {
            callerId: number;
            offer: RTCSessionDescriptionInit;
          }) => void
        ) => () => void;

        sendWebRTCAnswer: (
          receiverId: number,
          answer: RTCSessionDescriptionInit
        ) => Promise<void>;

        onWebRTCAnswer: (
          callback: (data: {
            receiverId: number;
            answer: RTCSessionDescriptionInit;
          }) => void
        ) => () => void;

        sendWebRTCIceCandidate: (
          receiverId: number,
          candidate: RTCIceCandidateInit
        ) => Promise<void>;

        onWebRTCIceCandidate: (
          callback: (data: {
            senderId: number;
            candidate: RTCIceCandidateInit;
          }) => void
        ) => () => void;
      };

      users: {
        findAll: () => Promise<User[]>;
      };
    };
  }
}
