export class ClaimResponseDto {
  id: string;
  itemId: string;
  claimMessage: string;
  status: string;
  createdAt: string;
  updatedAt: string;
  claimant: { id: string; email: string };

  constructor(claim: {
    id: string;
    itemId: string;
    claimMessage: string;
    status: string;
    createdAt: Date;
    updatedAt: Date;
    claimant: { id: string; email: string };
  }) {
    this.id = claim.id;
    this.itemId = claim.itemId;
    this.claimMessage = claim.claimMessage;
    this.status = claim.status;
    this.createdAt = claim.createdAt.toISOString();
    this.updatedAt = claim.updatedAt.toISOString();
    this.claimant = claim.claimant;
  }
}
