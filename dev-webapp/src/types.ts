export interface DeviceStatus {
  device_id: string;
  online: boolean;
  last_seen: number;
  status: {
    type: "status";
    device_id: string;
    uptime_s: number;
    free_heap: number;
    wifi_rssi: number;
    ip: string;
    cpu_freq_mhz: number;
    temp_c: number;
    ball_count: number;
    servo_open_angle: number;
    servo_settle_ms: number;
    sensor_distance_mm: number;
    dispenser: {
      state: "idle" | "dispensing" | "error";
      last_dispense_ts: number;
      total_dispensed: number;
      error: string | null;
    };
  } | null;
  command_history: {
    cmd_id: string;
    action: string;
    sent_at: number;
    ack: unknown;
    acked_at: number | null;
  }[];
}
