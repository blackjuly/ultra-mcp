CREATE TABLE `conversation_budgets` (
	`id` text PRIMARY KEY NOT NULL,
	`session_id` text NOT NULL,
	`max_tokens` integer,
	`max_cost_usd` real,
	`max_duration_ms` integer,
	`used_tokens` integer DEFAULT 0 NOT NULL,
	`used_cost_usd` real DEFAULT 0 NOT NULL,
	`used_duration_ms` integer DEFAULT 0 NOT NULL,
	`created_at` integer,
	`updated_at` integer,
	FOREIGN KEY (`session_id`) REFERENCES `sessions`(`id`) ON UPDATE no action ON DELETE cascade
);
--> statement-breakpoint
CREATE INDEX `conversation_budgets_session_id_idx` ON `conversation_budgets` (`session_id`);--> statement-breakpoint
CREATE TABLE `conversation_files` (
	`id` text PRIMARY KEY NOT NULL,
	`session_id` text NOT NULL,
	`file_path` text NOT NULL,
	`file_content` text,
	`content_hash` text,
	`added_at` integer,
	`last_accessed_at` integer,
	`access_count` integer DEFAULT 0 NOT NULL,
	`is_relevant` integer DEFAULT true,
	FOREIGN KEY (`session_id`) REFERENCES `sessions`(`id`) ON UPDATE no action ON DELETE cascade
);
--> statement-breakpoint
CREATE INDEX `conversation_files_session_id_idx` ON `conversation_files` (`session_id`);--> statement-breakpoint
CREATE INDEX `conversation_files_content_hash_idx` ON `conversation_files` (`content_hash`);--> statement-breakpoint
CREATE INDEX `conversation_files_relevance_idx` ON `conversation_files` (`session_id`,`is_relevant`);--> statement-breakpoint
CREATE TABLE `conversation_messages` (
	`id` text PRIMARY KEY NOT NULL,
	`session_id` text NOT NULL,
	`message_index` integer NOT NULL,
	`timestamp` integer,
	`role` text NOT NULL,
	`content` text NOT NULL,
	`tool_name` text,
	`parent_message_id` text,
	`metadata` text,
	FOREIGN KEY (`session_id`) REFERENCES `sessions`(`id`) ON UPDATE no action ON DELETE cascade
);
--> statement-breakpoint
CREATE INDEX `conversation_messages_session_id_idx` ON `conversation_messages` (`session_id`);--> statement-breakpoint
CREATE INDEX `conversation_messages_timestamp_idx` ON `conversation_messages` (`timestamp`);--> statement-breakpoint
CREATE INDEX `conversation_messages_message_index_idx` ON `conversation_messages` (`session_id`,`message_index`);--> statement-breakpoint
CREATE TABLE `sessions` (
	`id` text PRIMARY KEY NOT NULL,
	`name` text,
	`created_at` integer,
	`updated_at` integer,
	`last_message_at` integer,
	`status` text DEFAULT 'active' NOT NULL,
	`metadata` text
);
--> statement-breakpoint
CREATE INDEX `sessions_created_at_idx` ON `sessions` (`created_at`);--> statement-breakpoint
CREATE INDEX `sessions_status_idx` ON `sessions` (`status`);--> statement-breakpoint
CREATE INDEX `sessions_last_message_at_idx` ON `sessions` (`last_message_at`);