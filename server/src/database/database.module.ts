import { Global, Module } from '@nestjs/common';
import { DATABASE_POOL, createDatabasePool } from './database.provider';

@Global()
@Module({
  providers: [
    {
      provide: DATABASE_POOL,
      useFactory: createDatabasePool,
    },
  ],
  exports: [DATABASE_POOL],
})
export class DatabaseModule {}
