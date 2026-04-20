export class User {
  id: string;
  email: string;
  passwordHash: string;
  createdAt: Date;
  updatedAt: Date;
  profile?: {
    id: string;
    userId: string;
    firstName: string;
    secondName?: string;
    firstLastName: string;
    secondLastName: string;
    gender: 'MALE' | 'FEMALE' | 'OTHER' | 'PREFER_NOT_TO_SAY';
    profilePhotoUrl?: string;
    createdAt: Date;
    updatedAt: Date;
  };
}
