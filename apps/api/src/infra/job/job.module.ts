import { Module } from '@nestjs/common'
import { ScheduleModule } from '@nestjs/schedule'
import { OnCleanExpiredSessionTask } from './tacks/on-clean-expired-session-task'

@Module({
  imports: [ScheduleModule.forRoot()],
  providers: [OnCleanExpiredSessionTask],
})
export class JobModule {}
