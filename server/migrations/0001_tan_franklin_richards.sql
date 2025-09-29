PRAGMA foreign_keys=OFF;--> statement-breakpoint
CREATE TABLE `__new_session_tokens` (
	`token_id` integer PRIMARY KEY AUTOINCREMENT NOT NULL,
	`session_id` integer NOT NULL,
	`token_hash` text NOT NULL,
	`created_at` text NOT NULL,
	`expires_at` text,
	`is_used` integer DEFAULT false NOT NULL,
	FOREIGN KEY (`session_id`) REFERENCES `user_sessions`(`session_id`) ON UPDATE no action ON DELETE cascade
);
--> statement-breakpoint
INSERT INTO `__new_session_tokens`("token_id", "session_id", "token_hash", "created_at", "expires_at", "is_used") SELECT "token_id", "session_id", "token_hash", "created_at", "expires_at", "is_used" FROM `session_tokens`;--> statement-breakpoint
DROP TABLE `session_tokens`;--> statement-breakpoint
ALTER TABLE `__new_session_tokens` RENAME TO `session_tokens`;--> statement-breakpoint
PRAGMA foreign_keys=ON;--> statement-breakpoint
CREATE UNIQUE INDEX `session_tokens_token_hash_unique` ON `session_tokens` (`token_hash`);