interface Messenger {
  readonly id: string
  send: (to: Messenger, data: any) => any
  receive: (data: any) => any
}
const NullMessenger: Messenger = {
  id: 'NULL_MESSENGER',
  send: (to, data) => {
    throw 'Attempting to send from NULL messenger'
  },
  receive: (data) => {
    throw 'Attempting to receive as NULL messenger'
  },
}
class MessageChannel {
  private messengers: Messenger[] = [NullMessenger, NullMessenger]
  private getReceiver(sender: Messenger): Messenger {
    return this.messengers[0].id === sender.id
      ? this.messengers[0]
      : this.messengers[1]
  }
  queueMessage(from: Messenger, data: any) {
    this.getReceiver(from).send(data)
  }
  register(messenger: Messenger) {
    this.messengers[this.messengers.length] = messenger
  }
  registerAll(messenger1: Messenger, messenger2: Messenger) {
    this.messengers[0] = messenger1
    this.messengers[1] = messenger2
  }
}
