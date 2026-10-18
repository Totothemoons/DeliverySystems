
import {
  Injectable,
  InternalServerErrorException,
  ServiceUnavailableException,
} from '@nestjs/common';
import { ConfigService } from '@nestjs/config';

export interface DriverRouteCandidate {
  driverId: string;
  latitude: number;
  longitude: number;
}

export interface RankedDriver extends DriverRouteCandidate {
  distanceMeters: number;
  durationSeconds: number;
}

interface GoogleRouteMatrixElement {
  originIndex: number;
  destinationIndex: number;
  distanceMeters?: number;
  duration?: string;
  condition?: string;
  status?: {
    code?: number;
    message?: string;
  };
}

@Injectable()
export class GoogleRoutesService {
  private readonly apiKey: string;

  private readonly endpoint =
    'https://routes.googleapis.com/distanceMatrix/v2:computeRouteMatrix';

  constructor(private readonly configService: ConfigService) {
    const apiKey = this.configService.get<string>(
      'GOOGLE_MAPS_API_KEY',
    );

    if (!apiKey) {
      throw new Error('GOOGLE_MAPS_API_KEY is missing');
    }

    this.apiKey = apiKey;
  }

  async rankDriversByEta(
    drivers: DriverRouteCandidate[],
    restaurant: {
      latitude: number;
      longitude: number;
    },
  ): Promise<RankedDriver[]> {
    if (drivers.length === 0) {
      return [];
    }

    // จำกัดจำนวน candidate ต่อ request เพื่อควบคุมค่าใช้จ่าย
    const candidates = drivers.slice(0, 20);

    const body = {
      origins: candidates.map((driver) => ({
        waypoint: {
          location: {
            latLng: {
              latitude: driver.latitude,
              longitude: driver.longitude,
            },
          },
        },
      })),

      destinations: [
        {
          waypoint: {
            location: {
              latLng: {
                latitude: restaurant.latitude,
                longitude: restaurant.longitude,
              },
            },
          },
        },
      ],

      travelMode: 'DRIVE',
      routingPreference: 'TRAFFIC_AWARE',
    };

    let response: Response;

    try {
      response = await fetch(this.endpoint, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'X-Goog-Api-Key': this.apiKey,
          'X-Goog-FieldMask':
            'originIndex,destinationIndex,distanceMeters,duration,condition,status',
        },
        body: JSON.stringify(body),
        signal: AbortSignal.timeout(8000),
      });
    } catch {
      throw new ServiceUnavailableException(
        'Google Routes API is unavailable',
      );
    }

    if (!response.ok) {
      // ไม่ส่ง API key หรือรายละเอียดภายในกลับไปให้ client
      throw new InternalServerErrorException(
        'Failed to calculate driver routes',
      );
    }

    const elements =
      (await response.json()) as GoogleRouteMatrixElement[];

    const ranked: RankedDriver[] = [];

    for (const element of elements) {
      const driver = candidates[element.originIndex];

      if (!driver) continue;

      if (element.status?.code && element.status.code !== 0) {
        continue;
      }

      if (
        element.condition !== 'ROUTE_EXISTS' ||
        element.distanceMeters == null ||
        !element.duration
      ) {
        continue;
      }

      // Google duration มาในรูปแบบ เช่น "245s"
      const durationSeconds = Number.parseFloat(
        element.duration.replace(/s$/, ''),
      );

      if (!Number.isFinite(durationSeconds)) continue;

      ranked.push({
        ...driver,
        distanceMeters: element.distanceMeters,
        durationSeconds,
      });
    }

    // เลือกคนขับที่มีเวลาเดินทางโดยประมาณน้อยที่สุด
    return ranked.sort(
      (a, b) => a.durationSeconds - b.durationSeconds,
    );
  }
}
