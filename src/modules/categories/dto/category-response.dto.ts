export class CategoryResponseDto {
  id: string;
  name: string;
  slug: string;
  icon: string | null;
  description: string | null;

  constructor(category: {
    id: string;
    name: string;
    slug: string;
    icon: string | null;
    description: string | null;
  }) {
    this.id = category.id;
    this.name = category.name;
    this.slug = category.slug;
    this.icon = category.icon;
    this.description = category.description;
  }
}
