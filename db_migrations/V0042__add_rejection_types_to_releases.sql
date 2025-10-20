-- Добавляем новые статусы для системы отклонения релизов
-- rejected_fixable - отклонён, можно исправить и подать повторно
-- rejected_final - отклонён окончательно, нельзя исправить
-- draft - черновик (для релизов, которые артист исправляет)

COMMENT ON COLUMN t_p35759334_music_label_portal.releases.status IS 'Статус релиза: pending (на модерации), approved (одобрен), rejected_fixable (отклонён, можно исправить), rejected_final (отклонён окончательно), draft (черновик)';

-- Обновляем существующие rejected релизы в rejected_fixable (по умолчанию даём возможность исправить)
UPDATE t_p35759334_music_label_portal.releases 
SET status = 'rejected_fixable' 
WHERE status = 'rejected';
