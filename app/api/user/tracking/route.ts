import prisma, { Tx } from '@/lib/prisma';
import { devices, userAgent } from '@/lib/devices';
import { NextRequest, NextResponse } from 'next/server';
import { ip } from '@/lib/ip';
import { UserAgentSchema } from '@/schemas/user-agent';
import { Nil } from '@/lib/types';

const EVENTS_PER_RUN = 10;

export async function GET(request: NextRequest) {
  const authHeader = request.headers.get('authorization');
  if (authHeader !== `Bearer ${process.env.CRON_SECRET}`) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  try {
    const events = await prisma.userEvent.findMany({
      take: EVENTS_PER_RUN,
      orderBy: {
        timestamp: 'asc'
      }
    });

    let processedCount = 0;
    let errorCount = 0;
    const processedEventIds: string[] = [];

    for (const event of events) {
      try {
        await prisma.$transaction(async (tx) => {
          const geo = ip.parseGeo(event.geo);
          const fingerprint = devices.toFingerprint(event);
          const agent = userAgent.parse(event.userAgent);

          const deviceFingerprint = await saveFingerprint(tx, fingerprint);
          const deviceAgent = await saveDeviceAgent(tx, agent);
          const ipAddress = await saveIpAddress(tx, geo);

          if (deviceFingerprint) {
            await tx.userFingerprint.upsert({
              where: {
                userId_fingerprintId: {
                  userId: event.userId,
                  fingerprintId: deviceFingerprint.id
                }
              },
              create: {
                userId: event.userId,
                fingerprintId: deviceFingerprint.id,
                count: 1
              },
              update: {
                count: { increment: 1 }
              }
            });
          }

          if (deviceAgent) {
            await tx.userAgent.upsert({
              where: {
                userId_agentId: {
                  userId: event.userId,
                  agentId: deviceAgent.id
                }
              },
              create: {
                userId: event.userId,
                agentId: deviceAgent.id,
                count: 1
              },
              update: {
                count: { increment: 1 }
              }
            });
          }

          if (ipAddress) {
            await tx.userIpAddress.upsert({
              where: {
                userId_ipId: {
                  userId: event.userId,
                  ipId: ipAddress.id
                }
              },
              create: {
                userId: event.userId,
                ipId: ipAddress.id,
                count: 1
              },
              update: {
                count: { increment: 1 }
              }
            });
          }

          await tx.userScoringRequest.upsert({
            where: { userId: event.userId },
            create: { userId: event.userId },
            update: {}
          });

          // Delete the processed event
          await tx.userEvent.delete({
            where: { id: event.id }
          });

          console.log(`Processed event ${event.id} for user ${event.userId}`);
        });

        processedCount++;
        processedEventIds.push(event.id);
      } catch (error) {
        console.error(`Error processing event ${event.id}:`, error);
        errorCount++;
        // TODO: Send admin notification for processing failures
      }
    }

    console.log(`Processed ${processedCount} events, ${errorCount} errors.`);

    return NextResponse.json({
      success: true,
      processed: processedCount,
      errors: errorCount,
      total: events.length
    });
  } catch (error) {
    console.error('Tracking aggregation error:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}

// TODO: remove any checks here.
const saveFingerprint = async (tx: Tx, fingerprint: string) =>
  await tx.deviceFingerprint.upsert({
    where: { fingerprint },
    create: { fingerprint },
    update: {}
  });

const saveDeviceAgent = async (tx: Tx, agent: UserAgentSchema) => {
  return agent && agent.agent
    ? await tx.deviceAgent.upsert({
        where: { agent: agent.agent },
        create: {
          agent: agent.agent,
          device: agent.device,
          os: agent.os,
          browser: agent.browser
        },
        update: {}
      })
    : null;
};

const saveIpAddress = async (tx: Tx, geo: Nil<ip.IpSchema>) => {
  if (!geo || !geo.ip) return null;
  const fields = {
    asn: geo.connection.asn,
    isp: geo.connection.isp,
    org: geo.connection.org,
    domain: geo.connection.domain,
    country: geo.country,
    countryCode: geo.country_code,
    continent: geo.continent,
    continentCode: geo.continent_code,
    region: geo.region,
    regionCode: geo.region_code,
    city: geo.city,
    postal: geo.postal,
    callingCode: geo.calling_code,
    latitude: geo.latitude,
    longitude: geo.longitude,
    timezone: geo.timezone.id
  };

  return await tx.ipAddress.upsert({
    where: {
      ip: geo.ip
    },
    create: {
      ip: geo.ip,
      ...fields
    },
    update: {
      ip: geo.ip,
      ...fields
    }
  });
};
