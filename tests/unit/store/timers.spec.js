import store from '@/store/modules/timers'
import { LOAD_TIMERS_END, RESET_ALL } from '@/store/mutation-types'

describe('Timers store', () => {
  describe('Getters', () => {
    const timers = [
      { id: '1', task_id: 't1', start_time: '2024-01-01T10:00:00Z', end_time: null },
      { id: '2', task_id: 't2', start_time: '2024-01-01T08:00:00Z', end_time: '2024-01-01T09:00:00Z' }
    ]

    test('timers', () => {
      const state = { timers }
      expect(store.getters.timers(state)).toStrictEqual(timers)
    })

    test('currentTimer', () => {
      const state = { timers }
      expect(store.getters.currentTimer(state)).toStrictEqual(timers[0])
    })
  })

  describe('Mutations', () => {
    test('LOAD_TIMERS_END', () => {
      const state = { timers: [] }
      store.mutations[LOAD_TIMERS_END](state, [{ id: '1' }])
      expect(state.timers).toEqual([{ id: '1' }])
    })

    test('RESET_ALL', () => {
      const state = { timers: [{ id: '1' }] }
      store.mutations[RESET_ALL](state)
      expect(state.timers).toEqual([])
    })
  })
})
