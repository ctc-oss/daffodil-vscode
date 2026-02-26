export type ProfileTarget = 'editor' | 'disk'
export type ProfileMsg = {
  startOffset: number
  length: number
  target: ProfileTarget
}

export const profileStore = $state<ProfileTarget>('editor')
// export function setProfileTarget(target: ProfileTarget) {}
