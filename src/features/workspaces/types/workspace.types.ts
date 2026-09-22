export interface WorkspaceItem {
  readonly id: string;
  readonly name: string;
  readonly slug: string;
  readonly role?: string;
  readonly createdAt?: string;
  readonly updatedAt?: string;
}

export interface CreateWorkspaceInput {
  readonly name: string;
  readonly slug: string;
}
