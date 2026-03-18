import moment from 'moment-timezone'

import {
  getTimerDateOverlapMinutes,
  getTimerDurationMinutes,
  getTrackedMinutesByTaskForDate,
  getTaskStoppedTimerMinutesForDate,
  getTaskTrackedMinutesForDate,
  isTimerVisibleForDate
} from '@/lib/timers'

describe('Timers lib', () => {
  test('computes full timer duration', () => {
    const timer = {
      start_time: '2024-01-01T10:00:00Z',
      end_time: '2024-01-01T11:30:00Z'
    }

    expect(getTimerDurationMinutes(timer)).toBe(90)
  })

  test('computes date overlap in user timezone across midnight', () => {
    const timer = {
      start_time: '2024-01-01T22:30:00Z',
      end_time: '2024-01-02T01:30:00Z'
    }

    expect(
      getTimerDateOverlapMinutes(timer, '2024-01-01', 'Europe/Warsaw')
    ).toBe(30)
    expect(
      getTimerDateOverlapMinutes(timer, '2024-01-02', 'Europe/Warsaw')
    ).toBe(150)
  })

  test('adds manual time on top of timer overlap', () => {
    const timers = [
      {
        task_id: 'task-1',
        start_time: '2024-01-01T09:00:00Z',
        end_time: null
      }
    ]

    expect(
      getTaskTrackedMinutesForDate({
        taskId: 'task-1',
        timers,
        date: '2024-01-01',
        timezone: 'UTC',
        manualDuration: 120,
        now: moment.utc('2024-01-01T10:00:00Z')
      })
    ).toBe(180)
  })

  test('uses current time for running timers', () => {
    const timer = {
      start_time: '2024-01-01T10:00:00Z',
      end_time: null
    }
    const now = moment.utc('2024-01-01T11:15:00Z')

    expect(getTimerDurationMinutes(timer, now)).toBe(75)
  })

  test('keeps a newly started running timer visible before the first minute elapses', () => {
    const timer = {
      start_time: '2024-01-01T10:00:30Z',
      end_time: null
    }
    const now = moment.utc('2024-01-01T10:00:31Z')

    expect(isTimerVisibleForDate(timer, '2024-01-01', 'UTC', now)).toBe(true)
    expect(getTimerDateOverlapMinutes(timer, '2024-01-01', 'UTC', now)).toBe(0)
  })

  test('computes stopped timer minutes for a task and date', () => {
    const timers = [
      {
        task_id: 'task-1',
        start_time: '2024-01-01T09:00:00Z',
        end_time: '2024-01-01T09:12:00Z'
      },
      {
        task_id: 'task-1',
        start_time: '2024-01-01T10:00:00Z',
        end_time: null
      }
    ]

    expect(
      getTaskStoppedTimerMinutesForDate({
        taskId: 'task-1',
        timers,
        date: '2024-01-01',
        timezone: 'UTC',
        now: moment.utc('2024-01-01T10:30:00Z')
      })
    ).toBe(12)
  })

  test('aggregates tracked minutes by task for a day', () => {
    const timers = [
      {
        task_id: 'task-1',
        start_time: '2024-01-01T09:00:00Z',
        end_time: '2024-01-01T09:12:00Z'
      },
      {
        task_id: 'task-1',
        start_time: '2024-01-01T10:00:00Z',
        end_time: null
      },
      {
        task_id: 'task-2',
        start_time: '2024-01-01T11:00:00Z',
        end_time: '2024-01-01T11:30:00Z'
      }
    ]

    expect(
      getTrackedMinutesByTaskForDate({
        timers,
        date: '2024-01-01',
        timezone: 'UTC',
        now: moment.utc('2024-01-01T10:30:00Z')
      })
    ).toStrictEqual({
      'task-1': 42,
      'task-2': 30
    })
  })
})
