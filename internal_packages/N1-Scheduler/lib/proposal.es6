import {Utils} from 'nylas-exports'

export default class Proposal {
  constructor(args = {}) {
    this.id = Utils.generateFakeServerId()
    Object.assign(this, args)
  }
}
