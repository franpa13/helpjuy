import { z } from 'zod';

export const familyGroupNameSchema = z.object({ name: z.string().trim().min(1).max(60) });
export type FamilyGroupNameInput = z.infer<typeof familyGroupNameSchema>;

export const familyMuteSchema = z.object({ muted: z.boolean() });

export const emergencyAlertSchema = z.object({
  lat: z.number().min(-90).max(90).optional(),
  lng: z.number().min(-180).max(180).optional(),
});
export type EmergencyAlertInput = z.infer<typeof emergencyAlertSchema>;

export type FamilyRole = 'ADMIN' | 'MEMBER';

export type FamilyMemberDto = { userId: string; name: string; role: FamilyRole; isMe: boolean; joinedAt: string };

export type FamilyGroupDto = {
  id: string;
  name: string;
  myRole: FamilyRole;
  muted: boolean;
  members: FamilyMemberDto[];
  createdAt: string;
};

export type FamilyInviteDto = { id: string; invitedByName: string; createdAt: string; expiresAt: string };
export type CreatedInviteDto = { url: string; expiresAt: string };
export type InvitePreviewDto = { groupName: string; inviterName: string; memberCount: number };
export type EmergencyAlertResultDto = { notified: number };
