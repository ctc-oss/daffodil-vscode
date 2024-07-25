export interface RequestType<T = string | never> {
  readonly name: T
}
// export interface ServiceRequest extends RequestType{}
function createServiceRequest<T extends RequestType>(
  type: T['name']
): RequestType {
  return { name: type }
}
export interface SessionRequest extends RequestType {}
export interface ViewportRequest extends RequestType {}

export class ServiceRequestHandler {
  // request<R extends
}
