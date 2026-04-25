export class InboxClaimResponseDto {
  id: string;
  itemId: string;
  itemTitle: string;
  itemType: string;
  claimMessage: string;
  status: string;
  createdAt: string;
  claimant: { id: string; email: string };
  interactionLabel: 'aviso' | 'reclamo';

  constructor(claim: {
    id: string;
    claimMessage: string;
    status: string;
    createdAt: Date;
    claimant: { id: string; email: string };
    item: { id: string; title: string; type: string };
  }) {
    this.id = claim.id;
    this.itemId = claim.item.id;
    this.itemTitle = claim.item.title;
    this.itemType = claim.item.type;
    this.claimMessage = claim.claimMessage;
    this.status = claim.status;
    this.createdAt = claim.createdAt.toISOString();
    this.claimant = claim.claimant;
    this.interactionLabel = claim.item.type === 'lost_item' ? 'aviso' : 'reclamo';
  }
}
