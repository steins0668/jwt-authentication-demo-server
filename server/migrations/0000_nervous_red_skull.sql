CREATE TABLE `roles` (
	`role_id` integer PRIMARY KEY AUTOINCREMENT NOT NULL,
	`role` text NOT NULL
);
--> statement-breakpoint
CREATE UNIQUE INDEX `roles_role_unique` ON `roles` (`role`);--> statement-breakpoint
CREATE TABLE `session_tokens` (
	`token_id` integer PRIMARY KEY AUTOINCREMENT NOT NULL,
	`session_id` integer NOT NULL,
	`token_hash` text NOT NULL,
	`created_at` text NOT NULL,
	`expires_at` text,
	`is_used` integer DEFAULT false NOT NULL,
	FOREIGN KEY (`session_id`) REFERENCES `user_sessions`(`session_id`) ON UPDATE no action ON DELETE no action
);
--> statement-breakpoint
CREATE UNIQUE INDEX `session_tokens_token_hash_unique` ON `session_tokens` (`token_hash`);--> statement-breakpoint
CREATE TABLE `user_sessions` (
	`session_id` integer PRIMARY KEY AUTOINCREMENT NOT NULL,
	`user_id` integer NOT NULL,
	`session_hash` text NOT NULL,
	`created_at` text NOT NULL,
	`expires_at` text,
	`last_used_at` text NOT NULL,
	FOREIGN KEY (`user_id`) REFERENCES `users`(`user_id`) ON UPDATE cascade ON DELETE cascade
);
--> statement-breakpoint
CREATE UNIQUE INDEX `user_sessions_session_hash_unique` ON `user_sessions` (`session_hash`);--> statement-breakpoint
CREATE UNIQUE INDEX `user_sessions_session_hash_uidx` ON `user_sessions` (`session_hash`);--> statement-breakpoint
CREATE INDEX `user_sessions_user_id_idx` ON `user_sessions` (`user_id`);--> statement-breakpoint
CREATE INDEX `user_sessions_persistent_clean_up_idx` ON `user_sessions` (`expires_at`);--> statement-breakpoint
CREATE INDEX `user_sessions_session_clean_up_idx` ON `user_sessions` (`expires_at`,`last_used_at`) WHERE "user_sessions"."expires_at" is null;--> statement-breakpoint
CREATE TABLE `users` (
	`user_id` integer PRIMARY KEY AUTOINCREMENT NOT NULL,
	`role_id` integer NOT NULL,
	`email` text NOT NULL,
	`username` text NOT NULL,
	`password_hash` text NOT NULL,
	FOREIGN KEY (`role_id`) REFERENCES `roles`(`role_id`) ON UPDATE no action ON DELETE restrict
);
--> statement-breakpoint
CREATE UNIQUE INDEX `users_email_unique` ON `users` (`email`);--> statement-breakpoint
CREATE UNIQUE INDEX `users_username_unique` ON `users` (`username`);--> statement-breakpoint
CREATE UNIQUE INDEX `users_password_hash_unique` ON `users` (`password_hash`);