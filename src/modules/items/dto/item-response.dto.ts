export class ItemResponseDto {
  id: string;
  title: string;
  description: string;
  type: string;
  category: { id: string; name: string; slug: string; icon: string | null };
  status: string;
  location: string;
  eventDate: string;
  color: string | null;
  material: string | null;
  brand: string | null;
    photoUrl: string | null;
  user: { id: string; email: string; name: string };
  isOwner?: boolean;
  pendingClaimsCount?: number;
  createdAt: string;
  updatedAt: string;

  constructor(
    item: {
      id: string;
      title: string;
      description: string;
      type: string;
      category: { id: string; name: string; slug: string; icon: string | null };
      status: string;
      location: string;
      eventDate: Date;
        photoUrl: string | null;
      color: string | null;
      material: string | null;
      brand: string | null;
      user: {
        id: string;
        email: string;
        profile?: {
          firstName: string;
          secondName: string | null;
          firstLastName: string;
          secondLastName: string;
        } | null;
      };
      createdAt: Date;
      updatedAt: Date;
    },
    requestingUserId?: string,
    pendingClaimsCount?: number,
  ) {
    this.id = item.id;
    this.title = item.title;
    this.description = item.description;
    this.type = item.type;
    this.category = item.category;
    this.status = item.status;
    this.location = item.location;
    this.eventDate = item.eventDate.toISOString().split('T')[0];
    this.color = item.color;
    this.material = item.material;
    this.brand = item.brand;
      this.photoUrl = item.photoUrl ?? null;
    const profile = item.user.profile;
    const fullName = profile
      ? `${profile.firstName} ${profile.firstLastName}`
      : 'Usuario';

    this.user = {
      id: item.user.id,
      email: item.user.email,
      name: fullName,
    };
    this.createdAt = item.createdAt.toISOString();
    this.updatedAt = item.updatedAt.toISOString();
    if (requestingUserId !== undefined) {
      this.isOwner = item.user.id === requestingUserId;
      if (this.isOwner) {
        this.pendingClaimsCount = pendingClaimsCount ?? 0;
      }
    }
  }
}
