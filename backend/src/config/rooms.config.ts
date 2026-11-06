export interface RoomDefinition {
  code: 'blue' | 'red' | 'yellow';
  name: string;
  themeColor: 'blue' | 'red' | 'yellow';
  capacity: number;
  floor: string;
  description: string;
  amenities: string[];
  hourlyRate: number;
}

export const FIXED_ROOMS: RoomDefinition[] = [
  {
    code: 'blue',
    name: 'Blue Room',
    themeColor: 'blue',
    capacity: 10,
    floor: '2nd Floor - Tech Hub',
    description: 'High-tech collaboration hub designed for engineering standups, code reviews, and remote hybrid calls.',
    amenities: [
      'Dual 65" 4K Displays',
      'Cisco Webex Video Bar',
      'Dual Glass Whiteboards',
      '10 Ergonomic Task Chairs',
      'HDMI & USB-C Fast Hub'
    ],
    hourlyRate: 35
  },
  {
    code: 'red',
    name: 'Red Room',
    themeColor: 'red',
    capacity: 16,
    floor: '3rd Floor - Executive Suite',
    description: 'Prestigious executive boardroom ideal for client presentations, stakeholder pitches, and all-hands strategy sessions.',
    amenities: [
      '85" Ultra-HD Interactive Screen',
      'Dolby Ceiling Mic Array',
      'Acoustic Paneling & Sound Isolation',
      'Conference Phone & Polycom',
      'Executive Leather Seating'
    ],
    hourlyRate: 50
  },
  {
    code: 'yellow',
    name: 'Yellow Room',
    themeColor: 'yellow',
    capacity: 6,
    floor: '1st Floor - Creative Lounge',
    description: 'Vibrant, sunlit brainstorming studio outfitted with lounge seating, idea walls, and rapid prototyping tools.',
    amenities: [
      '55" Samsung The Frame Screen',
      'Floor-to-Ceiling Magnetic Idea Wall',
      'Acoustic Bean Bags & Standing Desk',
      'Wireless Screen Casting',
      'Podcast Recording Mics'
    ],
    hourlyRate: 25
  }
];
