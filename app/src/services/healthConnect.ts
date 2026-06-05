import { Platform } from 'react-native';

export interface DailyMetrics {
  steps: number;
  calories: number;
}

// Dynamically require the native module only on Android to avoid import crashes on Web/iOS
const getHealthConnectModule = () => {
  if (Platform.OS === 'android') {
    try {
      return require('react-native-health-connect');
    } catch (err) {
      console.warn('Health Connect: Failed to require native module', err);
      return null;
    }
  }
  return null;
};

/**
 * Checks if Health Connect SDK is installed and ready, then initializes it.
 * Returns the status code (1: available, 2: not installed, 3: update required, -1: unsupported platform).
 */
export const initializeHealthConnect = async (): Promise<number> => {
  if (Platform.OS !== 'android') return -1;
  
  const hc = getHealthConnectModule();
  if (!hc) return 2;

  try {
    const status = await hc.getSdkStatus();
    if (status === 1) {
      await hc.initialize();
      console.log('Health Connect: SDK available and initialized successfully.');
      return 1;
    } else {
      console.log('Health Connect: SDK status is not available. Status:', status);
      // Fallback: Try to initialize anyway. On Android 14+, Health Connect is a system service
      // and the SDK status check might return 3 (update required) or 2 (not installed) due to checking
      // for the legacy package name, but initialization could still succeed natively.
      try {
        await hc.initialize();
        console.log('Health Connect: Fallback initialization succeeded despite status:', status);
        return 1; // Override to available
      } catch (initErr) {
        console.warn('Health Connect: Fallback initialization failed:', initErr);
      }
    }
    return status;
  } catch (err) {
    console.error('Health Connect: Failed to initialize SDK:', err);
    return 2;
  }
};

/**
 * Triggers the native Android permission request dialog for Steps and Total Calories Burned.
 */
export const requestHealthPermissions = async (): Promise<boolean> => {
  if (Platform.OS !== 'android') return false;

  const hc = getHealthConnectModule();
  if (!hc) return false;

  try {
    const permissions = await hc.requestPermission([
      { accessType: 'read', recordType: 'Steps' },
      { accessType: 'read', recordType: 'TotalCaloriesBurned' },
      { accessType: 'read', recordType: 'HeartRate' },
      { accessType: 'read', recordType: 'SleepSession' },
    ]);
    console.log('Health Connect: Permissions request completed.', permissions);
    return true;
  } catch (err) {
    console.error('Health Connect: Failed to request permissions:', err);
    return false;
  }
};

/**
 * Queries steps and total calories burned from midnight today to the current time.
 */
export const fetchDailyHealthMetrics = async (): Promise<DailyMetrics> => {
  if (Platform.OS !== 'android') {
    return { steps: 0, calories: 0 };
  }

  const hc = getHealthConnectModule();
  if (!hc) {
    return { steps: 0, calories: 0 };
  }

  try {
    const now = new Date();
    // Start of today at 00:00:00 local time
    const startOfDay = new Date();
    startOfDay.setHours(0, 0, 0, 0);

    const timeRangeFilter = {
      operator: 'between',
      startTime: startOfDay.toISOString(),
      endTime: now.toISOString(),
    };

    console.log(`Health Connect Query: startTime=${startOfDay.toISOString()}, endTime=${now.toISOString()}`);

    // 1. Aggregate step count
    const stepsResult = await hc.aggregateRecord({
      recordType: 'Steps',
      timeRangeFilter,
    });
    const steps = stepsResult.COUNT_TOTAL || 0;

    // 2. Aggregate calories burned
    const calsResult = await hc.aggregateRecord({
      recordType: 'TotalCaloriesBurned',
      timeRangeFilter,
    });
    const calories = calsResult.ENERGY_TOTAL?.inKilocalories || 0;

    console.log(`Health Connect: Synced metrics - Steps: ${steps}, Calories: ${calories}`);
    return {
      steps: Math.round(steps),
      calories: Math.round(calories),
    };
  } catch (err) {
    console.error('Health Connect: Error fetching daily metrics:', err);
    return { steps: 0, calories: 0 };
  }
};

/**
 * Checks whether the app currently has read permissions for both Steps and Calories.
 */
export const checkHealthPermissions = async (): Promise<boolean> => {
  if (Platform.OS !== 'android') return false;

  const hc = getHealthConnectModule();
  if (!hc) return false;

  try {
    const granted = await hc.getGrantedPermissions();
    const hasSteps = granted.some(
      (p: any) => p.recordType === 'Steps' && p.accessType === 'read'
    );
    const hasCalories = granted.some(
      (p: any) => p.recordType === 'TotalCaloriesBurned' && p.accessType === 'read'
    );
    return hasSteps && hasCalories;
  } catch (err) {
    console.error('Health Connect: Error checking permissions:', err);
    return false;
  }
};

/**
 * Checks whether the app currently has read permissions for Heart Rate.
 */
export const checkHeartRatePermission = async (): Promise<boolean> => {
  if (Platform.OS !== 'android') return false;

  const hc = getHealthConnectModule();
  if (!hc) return false;

  try {
    const granted = await hc.getGrantedPermissions();
    return granted.some(
      (p: any) => p.recordType === 'HeartRate' && p.accessType === 'read'
    );
  } catch (err) {
    console.error('Health Connect: Error checking Heart Rate permission:', err);
    return false;
  }
};

/**
 * Queries heart rate beats-per-minute (BPM) from midnight today to current time.
 * Calculates and returns the average active heart rate.
 */
export const fetchHeartRateMetrics = async (): Promise<number> => {
  if (Platform.OS !== 'android') return 0;

  const hc = getHealthConnectModule();
  if (!hc) return 0;

  try {
    const now = new Date();
    const startOfDay = new Date();
    startOfDay.setHours(0, 0, 0, 0);

    const timeRangeFilter = {
      operator: 'between',
      startTime: startOfDay.toISOString(),
      endTime: now.toISOString(),
    };

    // readRecords returns heart rate data samples
    const records = await hc.readRecords('HeartRate', {
      timeRangeFilter,
    });

    if (records && records.length > 0) {
      let sum = 0;
      let count = 0;
      records.forEach((record: any) => {
        if (record.samples && record.samples.length > 0) {
          record.samples.forEach((sample: any) => {
            if (sample.beatsPerMinute) {
              sum += sample.beatsPerMinute;
              count++;
            }
          });
        }
      });
      return count > 0 ? Math.round(sum / count) : 0;
    }
    return 0;
  } catch (err) {
    console.error('Health Connect: Error fetching heart rate metrics:', err);
    return 0;
  }
};

/**
 * Checks whether the app currently has read permissions for Sleep.
 */
export const checkSleepPermission = async (): Promise<boolean> => {
  if (Platform.OS !== 'android') return false;

  const hc = getHealthConnectModule();
  if (!hc) return false;

  try {
    const granted = await hc.getGrantedPermissions();
    return granted.some(
      (p: any) => p.recordType === 'SleepSession' && p.accessType === 'read'
    );
  } catch (err) {
    console.error('Health Connect: Error checking Sleep permission:', err);
    return false;
  }
};

export interface SleepMetrics {
  durationMinutes: number;
  stageDeepMinutes: number;
}

/**
 * Queries sleep session records for the last 24 hours.
 * Returns the total duration of sleep session and computed deep sleep duration.
 */
export const fetchSleepSessionMetrics = async (): Promise<SleepMetrics> => {
  if (Platform.OS !== 'android') {
    return { durationMinutes: 0, stageDeepMinutes: 0 };
  }

  const hc = getHealthConnectModule();
  if (!hc) {
    return { durationMinutes: 0, stageDeepMinutes: 0 };
  }

  try {
    const now = new Date();
    // Query last 24 hours
    const yesterday = new Date();
    yesterday.setDate(now.getDate() - 1);

    const timeRangeFilter = {
      operator: 'between',
      startTime: yesterday.toISOString(),
      endTime: now.toISOString(),
    };

    const records = await hc.readRecords('SleepSession', {
      timeRangeFilter,
    });

    let totalDurationMs = 0;

    if (records && records.length > 0) {
      records.forEach((record: any) => {
        const start = new Date(record.startTime).getTime();
        const end = new Date(record.endTime).getTime();
        if (end > start) {
          totalDurationMs += (end - start);
        }
      });
    }

    const durationMinutes = Math.round(totalDurationMs / (60 * 1000));
    const stageDeepMinutes = Math.round(durationMinutes * 0.35); // Estimate deep sleep as 35% of total session

    return {
      durationMinutes,
      stageDeepMinutes,
    };
  } catch (err) {
    console.error('Health Connect: Error fetching sleep session metrics:', err);
    return { durationMinutes: 0, stageDeepMinutes: 0 };
  }
};

/**
 * Queries steps for any custom date/time range.
 */
export const fetchStepsForDateRange = async (startTime: Date, endTime: Date): Promise<number> => {
  if (Platform.OS !== 'android') return 0;

  const hc = getHealthConnectModule();
  if (!hc) return 0;

  try {
    const timeRangeFilter = {
      operator: 'between',
      startTime: startTime.toISOString(),
      endTime: endTime.toISOString(),
    };

    const stepsResult = await hc.aggregateRecord({
      recordType: 'Steps',
      timeRangeFilter,
    });
    return Math.round(stepsResult.COUNT_TOTAL || 0);
  } catch (err) {
    console.error(`Health Connect: Error fetching steps for range ${startTime.toISOString()} to ${endTime.toISOString()}:`, err);
    return 0;
  }
};

/**
 * Queries steps for a specific Date (local time 00:00 to 23:59 or current time).
 */
export const fetchStepsForDate = async (date: Date): Promise<number> => {
  if (Platform.OS !== 'android') return 0;
  
  const hc = getHealthConnectModule();
  if (!hc) return 0;

  try {
    const startOfDay = new Date(date);
    startOfDay.setHours(0, 0, 0, 0);

    const endOfDay = new Date(date);
    endOfDay.setHours(23, 59, 59, 999);

    // If date is today, end range is now
    const now = new Date();
    const isToday = date.toDateString() === now.toDateString();
    const endTime = isToday ? now.toISOString() : endOfDay.toISOString();

    return await fetchStepsForDateRange(startOfDay, new Date(endTime));
  } catch (err) {
    console.error(`Health Connect: Error fetching steps for date ${date.toDateString()}:`, err);
    return 0;
  }
};

/**
 * Queries steps for multiple specific dates in parallel.
 * Returns a map of date strings to step counts.
 */
export const fetchStepsForDates = async (dates: Date[]): Promise<Record<string, number>> => {
  if (Platform.OS !== 'android') return {};

  const hc = getHealthConnectModule();
  if (!hc) return {};

  try {
    const promises = dates.map(async (date) => {
      const steps = await fetchStepsForDate(date);
      return { dateStr: date.toDateString(), steps };
    });

    const results = await Promise.all(promises);
    const stepMap: Record<string, number> = {};
    results.forEach((res) => {
      stepMap[res.dateStr] = res.steps;
    });
    return stepMap;
  } catch (err) {
    console.error('Health Connect: Error fetching steps for multiple dates:', err);
    return {};
  }
};

/**
 * Queries all individual step records for today and aggregates them by hour (0 to 23).
 * Returns an array of 24 numbers.
 */
export const fetchHourlyStepsForToday = async (): Promise<number[] | null> => {
  if (Platform.OS !== 'android') return null;

  const hc = getHealthConnectModule();
  if (!hc) return null;

  try {
    const now = new Date();
    const startOfDay = new Date();
    startOfDay.setHours(0, 0, 0, 0);

    const timeRangeFilter = {
      operator: 'between',
      startTime: startOfDay.toISOString(),
      endTime: now.toISOString(),
    };

    const records = await hc.readRecords('Steps', {
      timeRangeFilter,
    });

    const hourlySteps = Array(24).fill(0);
    if (records && records.length > 0) {
      records.forEach((record: any) => {
        const hr = new Date(record.startTime).getHours();
        hourlySteps[hr] += record.count || 0;
      });
      return hourlySteps;
    }
    return null;
  } catch (err) {
    console.error('Health Connect: Error fetching hourly steps:', err);
    return null;
  }
};
