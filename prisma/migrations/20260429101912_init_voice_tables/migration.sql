-- CreateTable
CREATE TABLE `Voice` (
    `id` VARCHAR(191) NOT NULL,
    `name` VARCHAR(191) NOT NULL,
    `sampleUrl` VARCHAR(191) NOT NULL,
    `voiceId` VARCHAR(191) NOT NULL,
    `createdAt` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),

    UNIQUE INDEX `Voice_voiceId_key`(`voiceId`),
    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `Synthesis` (
    `id` VARCHAR(191) NOT NULL,
    `voiceId` VARCHAR(191) NOT NULL,
    `text` TEXT NOT NULL,
    `outputUrl` VARCHAR(191) NULL,
    `durationMs` INTEGER NULL,
    `createdAt` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
    `updatedAt` DATETIME(3) NOT NULL,

    INDEX `Synthesis_voiceId_createdAt_idx`(`voiceId`, `createdAt`),
    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- AddForeignKey
ALTER TABLE `Synthesis` ADD CONSTRAINT `Synthesis_voiceId_fkey` FOREIGN KEY (`voiceId`) REFERENCES `Voice`(`id`) ON DELETE CASCADE ON UPDATE CASCADE;
