import assert from 'assert'
import { describe, it } from 'mocha'

/* Mediator purpose is to route Events that are known by ALL components */

/// Event interface that all events must adhere to
// interface EventData {
//   toString(): string
// }

/// A concrete Event implementation
// class PlayerScoredGoal implements EventData {
//   constructor(
//     readonly player: Player,
//     readonly totalGoals: number
//   ) {}
//   toString(): string {
//     return this.player.name + ' scored a goal! (' + this.totalGoals + ')'
//   }
// }

/// Type signature for event handling function
// type GameSignal = (event: EventData) => void
/// Mediator that sends events to registered listeners
// class Game {
//   public eventListeners: GameSignal[] = []
//   handle(event: EventData): void {
//     this.eventListeners.forEach((listener) => listener(event))
//   }
// }

/// Mediator Component that only sends event data, does not process
class Player {
  totalGoals: number = 0
  energy: number = 100.0
  feedback: string = ''
  constructor(
    readonly name: string,
    readonly game: Game
  ) {
    this.game.register(GameEventType.timeout, [(content: Timeout) => {}])
  }
  score() {
    this.game.signal(new PlayerScoredGoal(this, ++this.totalGoals))
  }
  giveFeedback(feedback: string) {
    this.feedback = feedback
  }
  rest(time: number) {
    this.energy *= time * 0.1
  }
}

/// Mediator Component that only receives event data and uses it
class Coach {
  protected events: { [E in GameEventType]: EventHandler } = {
    [GameEventType.score]: function (content: PlayerScoredGoal): void {
      const { player } = content
      player.giveFeedback('Great work, ' + player.name)
    },
    [GameEventType.timeout]: function (content: Timeout): void {
      throw new Error('Function not implemented.')
    },
    [GameEventType.end]: function (content: any): void {
      throw new Error('Function not implemented.')
    },
  }
  constructor(readonly game: Game) {
    Object.entries(this.events).forEach(([type, event]) => {
      this.game.register(GameEventType[type], [event])
    })
  }
}
class PlayerScoredGoal implements GameEvent {
  constructor(
    readonly player: Player,
    readonly totalGoals: number
  ) {}
  readonly type = GameEventType.score
  content() {
    return {
      player: this.player,
      goalCount: this.totalGoals,
    }
  }
}
class Timeout implements GameEvent {
  readonly type = GameEventType.timeout
  constructor(readonly time: number) {}
  content(): number {
    return this.time
  }
}
enum GameEventType {
  score = 'score',
  timeout = 'timeout',
  end = 'end',
}
interface GameEvent {
  readonly type: GameEventType
  content(): any
}
type EventHandler = (content: any) => void
type EventHandlerMap = Map<GameEventType, EventHandler[]>
interface GameMediator {
  signal(event: GameEvent): void
  register(type: GameEventType, handler: EventHandler[]): void
}
class Game implements GameMediator {
  handlers: EventHandlerMap = new Map()
  signal(event: GameEvent): void {
    const handlers = this.handlers.get(event.type)
    if (handlers) handlers.forEach((handler) => handler(event.content()))
  }
  register(type: GameEventType, handlers: EventHandler[]): void {
    const existingHandler = this.handlers.get(type)
    if (existingHandler) existingHandler.push(...handlers)
    else this.handlers.set(type, handlers)
  }
}
describe('Game Mediator Example', () => {
  const game = new Game()
  const harvey = new Player('Harvey', game)
  it('Should successfully register event handlers from components', () => {
    assert(harvey)

    let handlerCount = 0
    const expectedCount = 1
    game.handlers.forEach((handlerArray) => {
      console.log(handlerArray.length)
      handlerCount += handlerArray.length
    })
    assert.equal(handlerCount, expectedCount)
  })
  it('Should send events to all listeners', () => {
    const coach = new Coach(game)
    assert(coach)
    harvey.score()
    assert.equal(harvey.feedback, 'Great work, ' + harvey.name)
  })
})
