import dayjs from 'dayjs';

const ONE_HOUR_IN_SECONDS = 3600;

export const getDurationLabelFromDurationInSeconds = (duration?: number | null) => {
  let durationLabel = '00:00';
  if (duration) {
    const isDurationLongerThanHour = duration / ONE_HOUR_IN_SECONDS >= 1;
    const formattedDurationParam = isDurationLongerThanHour ? 'HH:mm:ss' : 'mm:ss';
    const formattedVideoDuration = dayjs
      .duration(duration, 'second')
      .format(formattedDurationParam);
    durationLabel = formattedVideoDuration;
  }

  return durationLabel;
};
