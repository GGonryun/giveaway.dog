import { Prisma, PrismaClient } from '@prisma/client';
import { nanoid } from 'nanoid';

const prisma = new PrismaClient();

function createOwnerUser(index: number): Prisma.UserCreateInput {
  return {
    name: `Team Owner ${index}`,
    email: `admin${index}@giveaway.dog`,
    emoji: index === 1 ? '👑' : '🏆',
    emailVerified: new Date()
  };
}

function createTeam(index: number, ownerEmail: string): Prisma.TeamCreateInput {
  const teams = [
    {
      name: 'Sample Gaming Studio',
      slug: 'sample-gaming-studio',
      logo: '🎮'
    },
    {
      name: 'Tech Innovators Inc',
      slug: 'tech-innovators-inc',
      logo: '💻'
    },
    {
      name: 'Creative Labs',
      slug: 'creative-labs',
      logo: '🎨'
    }
  ];

  const teamData = teams[index - 1] || {
    name: `Organization ${index}`,
    slug: `organization-${index}`,
    logo: '🏢'
  };

  return {
    name: teamData.name,
    slug: teamData.slug,
    logo: teamData.logo,
    members: {
      create: {
        user: {
          connect: { email: ownerEmail }
        },
        role: 'OWNER'
      }
    }
  };
}

function createParticipantUser(index: number): Prisma.UserCreateInput {
  const firstNames = [
    'Alice',
    'Bob',
    'Charlie',
    'Diana',
    'Eve',
    'Frank',
    'Grace',
    'Henry',
    'Ivy',
    'Jack',
    'Kate',
    'Liam',
    'Mia',
    'Noah',
    'Olivia',
    'Peter',
    'Quinn',
    'Ruby',
    'Sam',
    'Tara',
    'Uma',
    'Victor',
    'Wendy',
    'Xander',
    'Yara',
    'Zoe',
    'Alex',
    'Blake',
    'Casey',
    'Drew',
    'Emma',
    'Finn',
    'Gina',
    'Hugo',
    'Iris',
    'James',
    'Kelly',
    'Leo',
    'Maya',
    'Nate',
    'Oscar',
    'Paige',
    'Quincy',
    'Rosa',
    'Sean',
    'Tina',
    'Uri',
    'Vera',
    'Wade',
    'Xena',
    'York',
    'Zara',
    'Aaron',
    'Bella',
    'Carl',
    'Dina',
    'Eli',
    'Faye',
    'Greg',
    'Hope',
    'Ian',
    'Jade'
  ];
  const lastNames = [
    'Johnson',
    'Smith',
    'Davis',
    'Miller',
    'Wilson',
    'Brown',
    'Taylor',
    'Anderson',
    'Thomas',
    'Martinez',
    'Garcia',
    'Rodriguez',
    'Lee',
    'Walker',
    'Hall',
    'Allen',
    'Young',
    'King',
    'Wright',
    'Lopez',
    'Hill',
    'Scott',
    'Green',
    'Adams',
    'Baker',
    'Nelson',
    'Carter',
    'Mitchell',
    'Roberts',
    'Turner',
    'Phillips',
    'Campbell',
    'Parker',
    'Evans',
    'Edwards',
    'Collins',
    'Stewart',
    'Morris',
    'Rogers',
    'Reed',
    'Cook',
    'Morgan',
    'Bell',
    'Murphy',
    'Bailey',
    'Rivera',
    'Cooper',
    'Richardson',
    'Cox',
    'Howard'
  ];
  const emojis = [
    '🎮',
    '🎲',
    '🎯',
    '🎪',
    '🎨',
    '🎭',
    '🎸',
    '🎹',
    '🎺',
    '🎻',
    '🎤',
    '🎧',
    '🎬',
    '🎰',
    '🎳',
    '🎵',
    '🎶',
    '🎼',
    '🎾',
    '⚽',
    '🏀',
    '🏈',
    '⚾',
    '🎣',
    '🎿',
    '🏂',
    '🏄',
    '🚴',
    '🏊',
    '🧗'
  ];

  const firstName = firstNames[index % firstNames.length];
  const lastName =
    lastNames[Math.floor(index / firstNames.length) % lastNames.length];
  const emoji = emojis[index % emojis.length];
  const suffix = Math.floor(index / (firstNames.length * lastNames.length));

  return {
    name: `${firstName} ${lastName}${suffix ? ` ${suffix}` : ''}`.trim(),
    email: `user${index}@example.com`,
    emoji: emoji
  };
}

function createTwitterUsername(index: number): string {
  const adjectives = [
    'gamer',
    'plays',
    'dev',
    'artist',
    'creator',
    'writes',
    'codes',
    'builds',
    'designs',
    'streams'
  ];
  return `user${index}_${adjectives[index % adjectives.length]}`;
}

function createIpAddress(index: number): Prisma.IpAddressCreateInput {
  const countries = [
    {
      name: 'United States',
      code: 'US',
      continent: 'North America',
      continentCode: 'NA'
    },
    {
      name: 'Canada',
      code: 'CA',
      continent: 'North America',
      continentCode: 'NA'
    },
    {
      name: 'United Kingdom',
      code: 'GB',
      continent: 'Europe',
      continentCode: 'EU'
    },
    { name: 'Germany', code: 'DE', continent: 'Europe', continentCode: 'EU' },
    { name: 'France', code: 'FR', continent: 'Europe', continentCode: 'EU' },
    {
      name: 'Australia',
      code: 'AU',
      continent: 'Oceania',
      continentCode: 'OC'
    },
    { name: 'Japan', code: 'JP', continent: 'Asia', continentCode: 'AS' },
    {
      name: 'Brazil',
      code: 'BR',
      continent: 'South America',
      continentCode: 'SA'
    }
  ];

  const country = countries[index % countries.length];
  const octet1 = Math.floor(Math.random() * 255) + 1;
  const octet2 = Math.floor(Math.random() * 255);
  const octet3 = Math.floor(Math.random() * 255);
  const octet4 = (index % 254) + 1;

  return {
    ip: `${octet1}.${octet2}.${octet3}.${octet4}`,
    asn: Math.floor(Math.random() * 65000) + 1000,
    isp: `ISP Provider ${(index % 10) + 1}`,
    org: `Organization ${(index % 20) + 1}`,
    country: country.name,
    countryCode: country.code,
    continent: country.continent,
    continentCode: country.continentCode,
    city: `City ${(index % 50) + 1}`,
    latitude: Math.random() * 180 - 90,
    longitude: Math.random() * 360 - 180,
    timezone: `UTC${Math.floor(Math.random() * 24) - 12}`
  };
}

function createDeviceAgent(index: number): Prisma.DeviceAgentCreateInput {
  const browsers = ['Chrome', 'Firefox', 'Safari', 'Edge', 'Opera', 'Brave'];
  const os = [
    'Windows NT 10.0',
    'Windows NT 11.0',
    'Macintosh; Intel Mac OS X 10_15_7',
    'Macintosh; Intel Mac OS X 14_0',
    'X11; Linux x86_64',
    'X11; Ubuntu',
    'iPhone; CPU iPhone OS 17_2 like Mac OS X',
    'iPhone; CPU iPhone OS 16_5 like Mac OS X',
    'Android 13',
    'Android 14'
  ];

  const browserIndex = index % browsers.length;
  const osIndex = index % os.length;
  const version = 100 + (index % 30);
  const minorVersion = index % 10;

  const isMobile =
    os[osIndex].includes('iPhone') || os[osIndex].includes('Android');

  return {
    agent: `Mozilla/5.0 (${os[osIndex]}) AppleWebKit/537.36 (KHTML, like Gecko) ${browsers[browserIndex]}/${version}.${minorVersion}.0.0 Safari/537.36 [${index}]`,
    device: isMobile ? 'Mobile' : 'Desktop',
    os: os[osIndex]
      .split(';')[0]
      .replace('Macintosh', 'macOS')
      .replace('X11', 'Linux'),
    browser: browsers[browserIndex]
  };
}

function createDeviceFingerprint(): Prisma.DeviceFingerprintCreateInput {
  return {
    fingerprint: nanoid(32)
  };
}

function createUserQuality(userId: string): Prisma.UserQualityCreateInput {
  const score = Math.floor(Math.random() * 40) + 60;
  return {
    user: { connect: { id: userId } },
    score,
    metrics: {
      ipReputation: Math.floor(Math.random() * 100),
      deviceTrust: Math.floor(Math.random() * 100),
      accountAge: Math.floor(Math.random() * 365),
      verifiedEmail: Math.random() > 0.2
    }
  };
}

function createSweepstake(
  index: number,
  teamId: string
): Prisma.SweepstakesCreateInput {
  const sweepstakes = [
    {
      name: 'Ultimate Gaming Bundle Giveaway',
      description:
        'Win an amazing gaming bundle including the latest games, merchandise, and exclusive in-game items! Complete tasks to increase your chances of winning.',
      slug: 'ultimate-gaming-bundle',
      prize: 'Complete Gaming Setup',
      daysToEnd: 30
    },
    {
      name: 'Tech Gadget Mega Raffle',
      description:
        'Enter to win the latest tech gadgets including smartphones, tablets, and smart home devices. Multiple winners will be selected!',
      slug: 'tech-gadget-mega-raffle',
      prize: 'Latest Tech Gadgets',
      daysToEnd: 14
    },
    {
      name: 'Creative Software License Giveaway',
      description:
        'Win lifetime licenses for professional creative software. Perfect for artists, designers, and content creators!',
      slug: 'creative-software-giveaway',
      prize: 'Software License Bundle',
      daysToEnd: 21
    },
    {
      name: 'Gaming Peripherals Collection',
      description:
        'Win a complete set of premium gaming peripherals including keyboard, mouse, headset, and monitor!',
      slug: 'gaming-peripherals-collection',
      prize: 'Premium Gaming Peripherals',
      daysToEnd: 45
    },
    {
      name: 'Digital Art Masterclass Access',
      description:
        'Get exclusive access to premium digital art courses and mentorship from industry professionals!',
      slug: 'digital-art-masterclass',
      prize: 'Masterclass Access',
      daysToEnd: 60
    },
    {
      name: 'Console Bundle Extravaganza',
      description:
        'Win the latest gaming console with a collection of top-rated games and accessories!',
      slug: 'console-bundle-extravaganza',
      prize: 'Gaming Console Bundle',
      daysToEnd: 28
    },
    {
      name: 'VR Experience Package',
      description:
        'Enter to win a complete VR setup with premium headset and exclusive game titles!',
      slug: 'vr-experience-package',
      prize: 'VR Setup',
      daysToEnd: 35
    },
    {
      name: 'Streaming Setup Bonanza',
      description:
        'Everything you need to start your streaming career! Win camera, microphone, lighting, and more!',
      slug: 'streaming-setup-bonanza',
      prize: 'Complete Streaming Setup',
      daysToEnd: 40
    },
    {
      name: 'Photography Equipment Giveaway',
      description:
        'Win professional photography equipment including camera, lenses, tripod, and editing software!',
      slug: 'photography-equipment-giveaway',
      prize: 'Photography Bundle',
      daysToEnd: 25
    },
    {
      name: 'Music Production Studio',
      description:
        'Get a complete music production setup with MIDI keyboard, audio interface, and premium plugins!',
      slug: 'music-production-studio',
      prize: 'Music Production Bundle',
      daysToEnd: 50
    },
    {
      name: 'Smart Home Automation Bundle',
      description:
        'Transform your home with smart devices, speakers, lights, and automation systems!',
      slug: 'smart-home-automation',
      prize: 'Smart Home Bundle',
      daysToEnd: 20
    },
    {
      name: 'Fitness Tech Collection',
      description:
        'Win the latest fitness trackers, smartwatches, and health monitoring devices!',
      slug: 'fitness-tech-collection',
      prize: 'Fitness Tech Bundle',
      daysToEnd: 33
    },
    {
      name: 'Developer Tools Package',
      description:
        'Premium developer tools, software licenses, and productivity accessories for coders!',
      slug: 'developer-tools-package',
      prize: 'Developer Bundle',
      daysToEnd: 42
    },
    {
      name: 'Content Creator Kit',
      description:
        'Everything a content creator needs: camera, editing software, graphics tablet, and more!',
      slug: 'content-creator-kit',
      prize: 'Creator Bundle',
      daysToEnd: 38
    },
    {
      name: 'Ultimate Esports Championship',
      description:
        'Win premium gaming gear, tournament entry, and coaching sessions with pro players!',
      slug: 'ultimate-esports-championship',
      prize: 'Esports Champion Package',
      daysToEnd: 55
    }
  ];

  const data = sweepstakes[index - 1] || {
    name: `Giveaway ${index}`,
    description: `Amazing giveaway number ${index} with incredible prizes!`,
    slug: `giveaway-${index}`,
    prize: `Prize Package ${index}`,
    daysToEnd: 30
  };

  return {
    id: nanoid(),
    status: 'ACTIVE',
    team: {
      connect: { id: teamId }
    },
    details: {
      create: {
        name: data.name,
        description: data.description,
        banner: `https://picsum.photos/seed/${nanoid()}/1920/1080`
      }
    },
    timing: {
      create: {
        startDate: new Date(),
        endDate: new Date(Date.now() + data.daysToEnd * 24 * 60 * 60 * 1000),
        timeZone: 'America/New_York'
      }
    },
    terms: {
      create: {
        type: 'TEMPLATE',
        sponsorName: 'Sample Gaming Studio',
        sponsorAddress: '123 Gaming St, San Francisco, CA 94102',
        winnerSelectionMethod: 'Random drawing from eligible entries',
        notificationTimeframeDays: 7,
        maxEntriesPerUser: null,
        claimDeadlineDays: 14,
        governingLawCountry: 'United States',
        privacyPolicyUrl: 'https://example.com/privacy',
        additionalTerms: 'Must be 18 or older to participate.'
      }
    },
    audience: {
      create: {
        requireEmail: true,
        minimumAgeRestriction: {
          create: {
            value: 18,
            label: 'I confirm I am 18 years or older',
            required: true,
            format: 'CHECKBOX'
          }
        }
      }
    },
    visibility: {
      create: {
        visibility: 'PUBLIC',
        slug: data.slug
      }
    },
    design: {
      create: {
        data: {}
      }
    },
    criteria: {
      create: {
        minTasksCompleted: 1,
        minQualityScore: 70,
        allowMultipleWins: false
      }
    },
    prizes: {
      create: [
        {
          id: nanoid(),
          name: data.prize,
          index: 0,
          quota: 1
        }
      ]
    }
  };
}

function createTasks(sweepstakesId: string): Prisma.TaskCreateInput[] {
  return [
    {
      id: nanoid(),
      sweepstakes: {
        connect: { id: sweepstakesId }
      },
      index: 0,
      config: {
        type: 'BONUS_TASK',
        title: 'Join the Giveaway',
        value: 1,
        mandatory: true,
        tasksRequired: 0
      }
    },
    {
      id: nanoid(),
      sweepstakes: {
        connect: { id: sweepstakesId }
      },
      index: 1,
      config: {
        type: 'TWITTER_CONNECT',
        title: 'Connect your X (Twitter) account',
        value: 5,
        mandatory: false,
        tasksRequired: 0
      }
    },
    {
      id: nanoid(),
      sweepstakes: {
        connect: { id: sweepstakesId }
      },
      index: 2,
      config: {
        type: 'TWITTER_FOLLOW',
        title: 'Follow us on X',
        value: 10,
        mandatory: false,
        tasksRequired: 0,
        username: 'https://x.com/giveawaydog'
      }
    },
    {
      id: nanoid(),
      sweepstakes: {
        connect: { id: sweepstakesId }
      },
      index: 3,
      config: {
        type: 'TWITTER_RETWEET',
        title: 'Repost our announcement',
        value: 15,
        mandatory: false,
        tasksRequired: 0,
        tweetId: 'https://x.com/giveawaydog/status/1234567890'
      }
    },
    {
      id: nanoid(),
      sweepstakes: {
        connect: { id: sweepstakesId }
      },
      index: 4,
      config: {
        type: 'DISCORD_JOIN',
        title: 'Join our Discord server',
        value: 10,
        mandatory: false,
        tasksRequired: 0,
        invite: 'https://discord.gg/abcd1234',
        channel: 'https://discord.com/channels/1234567890/9876543210'
      }
    },
    {
      id: nanoid(),
      sweepstakes: {
        connect: { id: sweepstakesId }
      },
      index: 5,
      config: {
        type: 'VISIT_URL',
        title: 'Visit our website',
        value: 5,
        mandatory: false,
        tasksRequired: 0,
        href: 'https://example.com',
        label: 'Visit Site'
      }
    }
  ];
}

async function main() {
  console.debug('Starting seed...');

  const teams = [];
  const allUsers = [];

  console.debug('Creating organizations and owners...');
  for (let i = 1; i <= 3; i++) {
    const ownerData = createOwnerUser(i);
    const owner = await prisma.user.create({
      data: ownerData
    });
    allUsers.push(owner);

    const teamData = createTeam(i, ownerData.email!);
    const team = await prisma.team.create({
      data: teamData
    });
    teams.push(team);
  }

  console.debug('Creating IP addresses, device agents, and fingerprints...');
  const ipAddresses = [];
  const deviceAgents = [];
  const fingerprints = [];

  for (let i = 0; i < 100; i++) {
    const ip = await prisma.ipAddress.create({
      data: createIpAddress(i)
    });
    ipAddresses.push(ip);

    const agent = await prisma.deviceAgent.create({
      data: createDeviceAgent(i)
    });
    deviceAgents.push(agent);

    const fingerprint = await prisma.deviceFingerprint.create({
      data: createDeviceFingerprint()
    });
    fingerprints.push(fingerprint);
  }

  console.debug('Creating 1000 participant users...');
  const users = [];
  for (let i = 0; i < 1000; i++) {
    if (i % 100 === 0) {
      console.debug(`  Created ${i} users...`);
    }

    const userData = createParticipantUser(i);
    const user = await prisma.user.create({
      data: {
        name: userData.name,
        email: userData.email,
        emoji: userData.emoji,
        emailVerified: new Date(),
        accounts: {
          create: [
            {
              type: 'oauth',
              provider: 'twitter',
              providerAccountId: `twitter_${nanoid(10)}`,
              access_token: `fake_token_${nanoid(20)}`,
              scope: 'users.read tweet.read offline.access',
              label: `@${createTwitterUsername(i)}`
            }
          ]
        }
      }
    });
    users.push(user);

    const selectedIp = ipAddresses[i % ipAddresses.length];
    await prisma.userIpAddress.create({
      data: {
        userId: user.id,
        ipId: selectedIp.id,
        count: Math.floor(Math.random() * 10) + 1
      }
    });

    const selectedAgent = deviceAgents[i % deviceAgents.length];
    await prisma.userAgent.create({
      data: {
        userId: user.id,
        agentId: selectedAgent.id,
        count: Math.floor(Math.random() * 20) + 1
      }
    });

    const selectedFingerprint = fingerprints[i % fingerprints.length];
    await prisma.userFingerprint.create({
      data: {
        userId: user.id,
        fingerprintId: selectedFingerprint.id,
        count: Math.floor(Math.random() * 15) + 1
      }
    });

    await prisma.userQuality.create({
      data: createUserQuality(user.id)
    });
  }

  console.debug('Creating 15 sweepstakes...');
  const allSweepstakes = [];

  for (let i = 1; i <= 15; i++) {
    const teamIndex = (i - 1) % teams.length;
    const sweepstakeData = createSweepstake(i, teams[teamIndex].id);
    const sweepstakes = await prisma.sweepstakes.create({
      data: sweepstakeData
    });
    allSweepstakes.push(sweepstakes);

    console.debug(`Creating tasks for sweepstakes ${i}...`);
    const taskInputs = createTasks(sweepstakes.id);
    const tasks = await Promise.all(
      taskInputs.map((taskData) => prisma.task.create({ data: taskData }))
    );

    console.debug(`Creating participations for sweepstakes ${i}...`);
    const participantsCount = Math.floor(Math.random() * 300) + 100;
    const shuffledUsers = [...users].sort(() => Math.random() - 0.5);
    const participatingUsers = shuffledUsers.slice(0, participantsCount);

    for (const user of participatingUsers) {
      await prisma.ageVerification.create({
        data: {
          userId: user.id,
          sweepstakesId: sweepstakes.id,
          verified: true,
          verifiedAt: new Date()
        }
      });

      const numTasksToComplete = Math.floor(Math.random() * tasks.length) + 1;
      const shuffledTasks = [...tasks].sort(() => Math.random() - 0.5);
      const tasksToComplete = shuffledTasks.slice(0, numTasksToComplete);

      for (const task of tasksToComplete) {
        await prisma.taskCompletion.create({
          data: {
            userId: user.id,
            taskId: task.id,
            status: 'COMPLETED',
            completedAt: new Date(
              Date.now() - Math.random() * 7 * 24 * 60 * 60 * 1000
            ),
            proof: {
              timestamp: new Date().toISOString()
            }
          }
        });

        await prisma.taskProgress.create({
          data: {
            userId: user.id,
            taskId: task.id,
            count: 1
          }
        });
      }
    }
  }

  console.debug('Seed completed successfully!');
  console.debug(`
Summary:
- Created ${teams.length} organizations
- Created ${teams.length} team owners
- Created ${users.length} participant users
- Created ${ipAddresses.length} IP addresses
- Created ${deviceAgents.length} device agents
- Created ${fingerprints.length} device fingerprints
- Created ${users.length} user quality records
- Created ${allSweepstakes.length} active sweepstakes
- Created varying amounts of participation (100-400 users per sweepstakes)

Organizations:
${teams.map((t) => `  - ${t.name} (/${t.slug})`).join('\n')}

Sweepstakes:
${allSweepstakes.map((s, idx) => `  - Sweepstakes ${idx + 1}: /giveaway/${s.id}`).join('\n')}
  `);
}

main()
  .catch((e) => {
    console.error('Error seeding database:', e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
