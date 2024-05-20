export class Book {
  isbn(): string {
    return '1234'
  }
}
export class BookEvent {
  constructor(readonly name: string) {}
}
declare module '../lib/registry' {
  export interface DataTypeRegistry {
    book: Book
  }
  export interface DataEditorEvents {
    bookEvent: BookEvent
  }
}
