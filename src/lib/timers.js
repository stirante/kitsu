import moment from 'moment-timezone'

const sameTaskId = (left, right) => String(left) === String(right)
const getTimerStartMoment = timer => moment.utc(timer.start_time)

const getTimerDayBounds = (date, timezone) => {
  const dayStart = moment.tz(date, 'YYYY-MM-DD', timezone).utc()
  return {
    dayStart,
    dayEnd: dayStart.clone().add(1, 'day')
  }
}

export const getTimerEndMoment = (timer, now = moment.utc()) => {
  if (timer.end_time) {
    return moment.utc(timer.end_time)
  }

  return moment.max(now.clone(), getTimerStartMoment(timer))
}

export const getTimerDurationMinutes = (timer, now = moment.utc()) => {
  return Math.max(
    0,
    getTimerEndMoment(timer, now).diff(getTimerStartMoment(timer), 'minutes')
  )
}

export const getTimerDateOverlapMinutes = (
  timer,
  date,
  timezone,
  now = moment.utc()
) => {
  if (!date || !timezone) {
    return getTimerDurationMinutes(timer, now)
  }

  const { dayStart, dayEnd } = getTimerDayBounds(date, timezone)
  const start = getTimerStartMoment(timer)
  const end = getTimerEndMoment(timer, now)
  const overlapStart = moment.max(start, dayStart)
  const overlapEnd = moment.min(end, dayEnd)

  return Math.max(0, overlapEnd.diff(overlapStart, 'minutes'))
}

export const isTimerVisibleForDate = (
  timer,
  date,
  timezone,
  now = moment.utc()
) => {
  if (!date || !timezone) {
    return true
  }

  const { dayStart, dayEnd } = getTimerDayBounds(date, timezone)
  const start = getTimerStartMoment(timer)
  const end = getTimerEndMoment(timer, now)
  const overlapStart = moment.max(start, dayStart)
  const overlapEnd = moment.min(end, dayEnd)

  if (overlapEnd.isAfter(overlapStart)) {
    return true
  }

  return !timer.end_time && start.isBetween(dayStart, dayEnd, undefined, '[)')
}

export const getTaskTrackedMinutesForDate = ({
  taskId,
  timers = [],
  date,
  timezone,
  manualDuration = 0,
  now = moment.utc()
}) => {
  const timerDuration = timers
    .filter(timer => sameTaskId(timer.task_id, taskId))
    .reduce(
      (sum, timer) =>
        sum + getTimerDateOverlapMinutes(timer, date, timezone, now),
      0
    )

  return manualDuration + timerDuration
}

export const getTrackedMinutesByTaskForDate = ({
  timers = [],
  date,
  timezone,
  now = moment.utc()
}) => {
  return timers.reduce((minutesByTask, timer) => {
    const overlapMinutes = getTimerDateOverlapMinutes(
      timer,
      date,
      timezone,
      now
    )
    if (overlapMinutes <= 0) {
      return minutesByTask
    }

    const taskKey = String(timer.task_id)
    minutesByTask[taskKey] = (minutesByTask[taskKey] || 0) + overlapMinutes
    return minutesByTask
  }, {})
}

export const getTaskStoppedTimerMinutesForDate = ({
  taskId,
  timers = [],
  date,
  timezone,
  now = moment.utc()
}) =>
  timers
    .filter(timer => sameTaskId(timer.task_id, taskId) && !!timer.end_time)
    .reduce(
      (sum, timer) =>
        sum + getTimerDateOverlapMinutes(timer, date, timezone, now),
      0
    )

export const isSameTaskId = sameTaskId
