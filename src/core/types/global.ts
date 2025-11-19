export type ID = string;

export type Timestamp = Date;

export interface BaseEntity {
  id: ID;
  createdAt: Timestamp;
  updatedAt: Timestamp;
}

