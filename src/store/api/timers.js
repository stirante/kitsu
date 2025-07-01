import client from '@/store/api/client'
import { buildQueryString } from '@/lib/query'

export default {
  getTimers(date = undefined, embedTask = true) {
    const path = buildQueryString('/api/data/timers', {
      // Date must be in yyyy-MM-dd format
      date: date,
      embed_task: embedTask
    })
    return client.pget(path)
  },

  startTimer(taskId) {
    return client.ppost(`/api/actions/tasks/${taskId}/timer/start`, {})
  },

  endTimer() {
    return client.ppost('/api/actions/tasks/timer/end', {})
  },

  discardTimer() {
    return client.ppost('/api/actions/tasks/timer/discard', {})
  },

  updateTimer(timerId, data) {
    return client.ppatch(`/api/actions/tasks/timer/${timerId}`, data)
  },

  deleteTimer(timerId) {
    return client.pdel(`/api/actions/tasks/timer/${timerId}`)
  }
}
