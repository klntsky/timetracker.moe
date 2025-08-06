import { Settings } from '../types';

export type PresetRange =
  | 'THIS_WEEK'
  | 'LAST_WEEK'
  | 'TWO_WEEKS'
  | 'LAST_TWO_WEEKS'
  | 'THIS_MONTH'
  | 'LAST_MONTH'
  | 'CUSTOM';

export function getRange(
  range: PresetRange,
  settings: Settings,
  custom?: { from?: string; to?: string }
): [Date, Date] {
  const now = new Date();
  let start = new Date();
  let end = new Date();

  const weekStartOffset = settings.weekEndsOn === 'sunday' ? 1 : 0;

  switch (range) {
    case 'THIS_WEEK': {
      const diff = (now.getDay() + 7 - weekStartOffset) % 7;
      start.setDate(now.getDate() - diff);
      end = now;
      break;
    }
    case 'LAST_WEEK': {
      const diff = (now.getDay() + 7 - weekStartOffset) % 7;
      end.setDate(now.getDate() - diff - 1);
      start = new Date(end);
      start.setDate(end.getDate() - 6);
      break;
    }
    case 'TWO_WEEKS': {
      const diff = (now.getDay() + 7 - weekStartOffset) % 7;
      start.setDate(now.getDate() - diff - 13);
      end = now;
      break;
    }
    case 'LAST_TWO_WEEKS': {
      const diff = (now.getDay() + 7 - weekStartOffset) % 7;
      end.setDate(now.getDate() - diff - 1);
      start = new Date(end);
      start.setDate(end.getDate() - 13);
      break;
    }
    case 'THIS_MONTH': {
      start = new Date(now.getFullYear(), now.getMonth(), 1);
      end = now;
      break;
    }
    case 'LAST_MONTH': {
      start = new Date(now.getFullYear(), now.getMonth() - 1, 1);
      end = new Date(now.getFullYear(), now.getMonth(), 0);
      break;
    }
    case 'CUSTOM': {
      start = custom?.from ? new Date(custom.from) : now;
      end = custom?.to ? new Date(custom.to) : now;
      break;
    }
  }
  return [start, end];
}
