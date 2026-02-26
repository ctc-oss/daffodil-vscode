export type ProfileTarget = 'editor' | 'disk'
export type ProfileMsg = {
  startOffset: number
  length: number
  target: ProfileTarget
}

let profileStore = $state<ProfileTarget>('editor')
export const getProfileTarget = () => profileStore
export const setProfileTarget = (target: ProfileTarget) => {
  profileStore = target
}
// export function setProfileTarget(target: ProfileTarget) {}
