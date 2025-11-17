import os
import json
import uuid
from datetime import datetime, timedelta
from apscheduler.schedulers.background import BackgroundScheduler
from apscheduler.triggers.cron import CronTrigger
from apscheduler.triggers.date import DateTrigger
from apscheduler.jobstores.memory import MemoryJobStore
from apscheduler.executors.asyncio import AsyncIOExecutor
import logging
from telegram import Bot
from telegram.error import TelegramError
import asyncio

logger = logging.getLogger(__name__)

class SchedulerService:
    def __init__(self):
        self.scheduler = BackgroundScheduler(
            jobstores={'default': MemoryJobStore()},
            executors={'default': AsyncIOExecutor()},
            job_defaults={
                'coalesce': False,
                'max_instances': 3,
                'misfire_grace_time': 30
            },
            timezone='UTC'
        )

        # Initialize the event loop for AsyncIOExecutor
        try:
            import asyncio
            if not hasattr(self.scheduler, '_eventloop'):
                self.scheduler._eventloop = asyncio.new_event_loop()
        except Exception as e:
            logger.warning(f"Could not initialize event loop: {e}")

        self.tasks_file = os.path.join(os.path.dirname(__file__), 'scheduled_tasks.json')
        self.telegram_bot_token = os.getenv('TELEGRAM_BOT_TOKEN')
        self.telegram_chat_id = os.getenv('TELEGRAM_CHAT_ID')

        if self.telegram_bot_token and self.telegram_chat_id:
            self.telegram_bot = Bot(token=self.telegram_bot_token)
        else:
            self.telegram_bot = None
            logger.warning("Telegram bot not configured - notifications disabled")

        self._load_tasks()
        self._setup_scheduler()

    def _load_tasks(self):
        """Load scheduled tasks from JSON file"""
        try:
            if os.path.exists(self.tasks_file):
                with open(self.tasks_file, 'r') as f:
                    self.tasks = json.load(f)
            else:
                self.tasks = {}
        except Exception as e:
            logger.error(f"Error loading tasks: {e}")
            self.tasks = {}

    def _save_tasks(self):
        """Save scheduled tasks to JSON file"""
        try:
            with open(self.tasks_file, 'w') as f:
                json.dump(self.tasks, f, indent=2, default=str)
        except Exception as e:
            logger.error(f"Error saving tasks: {e}")

    def _setup_scheduler(self):
        """Setup scheduler and load existing jobs"""
        try:
            # Add existing tasks to scheduler
            for task_id, task in self.tasks.items():
                if task.get('status') == 'active':
                    self._schedule_task(task)

            # Start scheduler if not already running
            if not self.scheduler.running:
                self.scheduler.start()
                logger.info("Scheduler started successfully")

        except Exception as e:
            logger.error(f"Error setting up scheduler: {e}")

    def _schedule_task(self, task):
        """Schedule a task based on its configuration"""
        try:
            task_id = task['id']
            task_type = task['type']
            schedule_config = task['schedule']

            # Determine trigger based on schedule type
            if schedule_config['type'] == 'cron':
                # Cron expression: "0 6 * * 1" (Monday at 6 AM)
                cron_parts = schedule_config['expression'].split()
                if len(cron_parts) >= 5:
                    trigger = CronTrigger(
                        minute=cron_parts[0],
                        hour=cron_parts[1],
                        day=cron_parts[2],
                        month=cron_parts[3],
                        day_of_week=cron_parts[4]
                    )
                else:
                    logger.error(f"Invalid cron expression for task {task_id}")
                    return

            elif schedule_config['type'] == 'interval':
                # Interval in minutes
                interval_minutes = schedule_config.get('interval', 60)
                trigger = CronTrigger(minute=f"*/{interval_minutes}")

            elif schedule_config['type'] == 'once':
                # One-time execution
                next_run = datetime.fromisoformat(schedule_config['datetime'])
                trigger = DateTrigger(run_date=next_run)

            else:
                logger.error(f"Unknown schedule type for task {task_id}: {schedule_config['type']}")
                return

            # Add job to scheduler
            self.scheduler.add_job(
                func=self._execute_task,
                trigger=trigger,
                args=[task],
                id=task_id,
                name=task.get('name', f'Task {task_id}'),
                replace_existing=True
            )

            logger.info(f"Scheduled task {task_id} ({task_type})")

        except Exception as e:
            logger.error(f"Error scheduling task {task.get('id', 'unknown')}: {e}")

    async def _execute_task(self, task):
        """Execute a scheduled task"""
        try:
            task_id = task['id']
            task_type = task['type']

            logger.info(f"Executing scheduled task: {task_id} ({task_type})")

            # Update task status
            task['last_run'] = datetime.now().isoformat()
            task['status'] = 'running'
            self._save_tasks()

            result = None

            # Execute based on task type
            if task_type == 'report':
                result = await self._execute_report_task(task)
            elif task_type == 'investigation':
                result = await self._execute_investigation_task(task)
            elif task_type == 'scan':
                result = await self._execute_scan_task(task)
            else:
                logger.error(f"Unknown task type: {task_type}")
                return

            # Update task status and results
            task['status'] = 'active'
            task['last_result'] = {
                'timestamp': datetime.now().isoformat(),
                'success': result.get('success', False) if result else False,
                'message': result.get('message', 'Task completed') if result else 'Task completed'
            }

            # Send notification if configured
            if task.get('notifications', {}).get('enabled', False):
                await self._send_notification(task, result)

            self._save_tasks()
            logger.info(f"Task {task_id} completed successfully")

        except Exception as e:
            logger.error(f"Error executing task {task.get('id', 'unknown')}: {e}")
            # Update task with error status
            task['status'] = 'error'
            task['last_result'] = {
                'timestamp': datetime.now().isoformat(),
                'success': False,
                'message': str(e)
            }
            self._save_tasks()

    async def _execute_report_task(self, task):
        """Execute a scheduled report task"""
        try:
            from .google_sheets import GoogleSheetsService
            from .groq import GroqService

            sheets_service = GoogleSheetsService()
            groq_service = GroqService()

            # Get incidents data
            incidents_result = sheets_service.get_security_incidents()
            if not incidents_result['success']:
                return {'success': False, 'message': 'Failed to fetch incidents data'}

            incidents = incidents_result['data']

            # Generate report using AI
            report_result = groq_service.generate_incident_report(incidents)

            if report_result['success']:
                # Store report result
                task['report_data'] = report_result['data']
                return {
                    'success': True,
                    'message': f'Report generated for {len(incidents)} incidents',
                    'report_data': report_result['data']
                }
            else:
                return {'success': False, 'message': 'Failed to generate report'}

        except Exception as e:
            logger.error(f"Error executing report task: {e}")
            return {'success': False, 'message': str(e)}

    async def _execute_investigation_task(self, task):
        """Execute a scheduled investigation task"""
        try:
            from .ids_monitor import IDSMonitor
            from .groq import GroqService

            ids_monitor = IDSMonitor()
            groq_service = GroqService()

            # Get recent logs
            logs = ids_monitor.get_recent_logs(limit=100)

            if not logs:
                return {'success': True, 'message': 'No recent logs to investigate'}

            # Analyze logs with AI
            analysis_prompt = f"""
            Analyze these recent IDS logs for security threats:

            {json.dumps(logs[:20], indent=2)}

            Provide:
            1. Summary of suspicious activities
            2. Potential security threats
            3. Recommended actions
            """

            messages = [
                {"role": "system", "content": "You are a SOC analyst analyzing IDS logs for security threats."},
                {"role": "user", "content": analysis_prompt}
            ]

            analysis_result = groq_service.chat_completion(messages)

            if analysis_result['success']:
                task['investigation_data'] = {
                    'logs_analyzed': len(logs),
                    'analysis': analysis_result['data']['content'],
                    'timestamp': datetime.now().isoformat()
                }
                return {
                    'success': True,
                    'message': f'Investigated {len(logs)} logs',
                    'analysis': analysis_result['data']['content']
                }
            else:
                return {'success': False, 'message': 'Failed to analyze logs'}

        except Exception as e:
            logger.error(f"Error executing investigation task: {e}")
            return {'success': False, 'message': str(e)}

    async def _execute_scan_task(self, task):
        """Execute a scheduled scan task"""
        try:
            from .ids_monitor import IDSMonitor

            ids_monitor = IDSMonitor()

            # Get current status
            status = ids_monitor.get_status()

            # Perform health check
            health_score = status.get('stats', {}).get('system_health', 0)

            task['scan_data'] = {
                'timestamp': datetime.now().isoformat(),
                'health_score': health_score,
                'packets_processed': status.get('stats', {}).get('packets_processed', 0),
                'alerts_generated': status.get('stats', {}).get('alerts_generated', 0)
            }

            return {
                'success': True,
                'message': f'System scan completed. Health: {health_score}%',
                'health_score': health_score
            }

        except Exception as e:
            logger.error(f"Error executing scan task: {e}")
            return {'success': False, 'message': str(e)}

    async def _send_notification(self, task, result):
        """Send notification about task completion"""
        if not self.telegram_bot:
            return

        try:
            task_name = task.get('name', 'Scheduled Task')
            success = result.get('success', False) if result else False
            message = result.get('message', 'Task completed') if result else 'Task completed'

            notification_text = f"""
🔔 Scheduled Task Completed

📋 Task: {task_name}
✅ Status: {'Success' if success else 'Failed'}
📝 Result: {message}
🕐 Time: {datetime.now().strftime('%Y-%m-%d %H:%M:%S UTC')}
            """.strip()

            await self.telegram_bot.send_message(
                chat_id=self.telegram_chat_id,
                text=notification_text,
                parse_mode='HTML'
            )

            logger.info(f"Notification sent for task {task['id']}")

        except TelegramError as e:
            logger.error(f"Failed to send Telegram notification: {e}")
        except Exception as e:
            logger.error(f"Error sending notification: {e}")

    def create_task(self, task_data):
        """Create a new scheduled task"""
        try:
            task_id = str(uuid.uuid4())

            task = {
                'id': task_id,
                'name': task_data.get('name', f'Task {task_id}'),
                'type': task_data['type'],  # 'report', 'investigation', 'scan'
                'description': task_data.get('description', ''),
                'schedule': task_data['schedule'],
                'config': task_data.get('config', {}),
                'notifications': task_data.get('notifications', {'enabled': False}),
                'recipients': task_data.get('recipients', []),
                'status': 'active',
                'created_at': datetime.now().isoformat(),
                'created_by': task_data.get('created_by', 'system'),
                'last_run': None,
                'last_result': None
            }

            self.tasks[task_id] = task
            self._save_tasks()

            # Schedule the task
            self._schedule_task(task)

            logger.info(f"Created scheduled task: {task_id}")
            return {'success': True, 'task_id': task_id, 'task': task}

        except Exception as e:
            logger.error(f"Error creating task: {e}")
            return {'success': False, 'error': str(e)}

    def update_task(self, task_id, updates):
        """Update an existing task"""
        try:
            if task_id not in self.tasks:
                return {'success': False, 'error': 'Task not found'}

            task = self.tasks[task_id]

            # Update task data
            for key, value in updates.items():
                if key not in ['id', 'created_at', 'created_by']:
                    task[key] = value

            task['updated_at'] = datetime.now().isoformat()

            # Remove existing job and reschedule
            if self.scheduler.get_job(task_id):
                self.scheduler.remove_job(task_id)

            if task.get('status') == 'active':
                self._schedule_task(task)

            self._save_tasks()

            logger.info(f"Updated task: {task_id}")
            return {'success': True, 'task': task}

        except Exception as e:
            logger.error(f"Error updating task {task_id}: {e}")
            return {'success': False, 'error': str(e)}

    def delete_task(self, task_id):
        """Delete a task"""
        try:
            if task_id not in self.tasks:
                return {'success': False, 'error': 'Task not found'}

            # Remove from scheduler
            if self.scheduler.get_job(task_id):
                self.scheduler.remove_job(task_id)

            # Remove from tasks
            del self.tasks[task_id]
            self._save_tasks()

            logger.info(f"Deleted task: {task_id}")
            return {'success': True}

        except Exception as e:
            logger.error(f"Error deleting task {task_id}: {e}")
            return {'success': False, 'error': str(e)}

    def get_tasks(self, task_type=None, status=None):
        """Get all tasks, optionally filtered"""
        try:
            tasks = list(self.tasks.values())

            if task_type:
                tasks = [t for t in tasks if t['type'] == task_type]

            if status:
                tasks = [t for t in tasks if t['status'] == status]

            return {'success': True, 'tasks': tasks}

        except Exception as e:
            logger.error(f"Error getting tasks: {e}")
            return {'success': False, 'error': str(e)}

    def get_task(self, task_id):
        """Get a specific task"""
        try:
            if task_id not in self.tasks:
                return {'success': False, 'error': 'Task not found'}

            return {'success': True, 'task': self.tasks[task_id]}

        except Exception as e:
            logger.error(f"Error getting task {task_id}: {e}")
            return {'success': False, 'error': str(e)}

    def pause_task(self, task_id):
        """Pause a task"""
        return self.update_task(task_id, {'status': 'paused'})

    def resume_task(self, task_id):
        """Resume a paused task"""
        return self.update_task(task_id, {'status': 'active'})

    def get_scheduler_status(self):
        """Get scheduler status"""
        try:
            jobs = []
            for job in self.scheduler.get_jobs():
                jobs.append({
                    'id': job.id,
                    'name': job.name,
                    'next_run_time': job.next_run_time.isoformat() if job.next_run_time else None,
                    'trigger': str(job.trigger)
                })

            return {
                'success': True,
                'scheduler_running': self.scheduler.running,
                'jobs_count': len(jobs),
                'jobs': jobs
            }

        except Exception as e:
            logger.error(f"Error getting scheduler status: {e}")
            return {'success': False, 'error': str(e)}

    def shutdown(self):
        """Shutdown the scheduler"""
        try:
            if self.scheduler.running:
                self.scheduler.shutdown(wait=True)
            logger.info("Scheduler shutdown successfully")
        except Exception as e:
            logger.error(f"Error shutting down scheduler: {e}")
