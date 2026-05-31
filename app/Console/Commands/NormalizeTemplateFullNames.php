<?php

namespace App\Console\Commands;

use App\Models\Template;
use Illuminate\Console\Command;

/**
 * Backfill helper: rewrites every template's full_name into the canonical
 * "username/template_slug" form. Earlier code paths inconsistently used the
 * project name as the prefix, producing entries like "myproject/foo" that
 * confused multi-project listings.
 *
 * Defaults to --dry-run so the operator can review the diff before applying.
 * Use --apply to actually persist. --filter limits to a specific prefix
 * (handy for testing on a single user before a full run).
 *
 * Usage:
 *   php artisan templates:normalize-full-names                # dry-run all
 *   php artisan templates:normalize-full-names --apply        # commit all
 *   php artisan templates:normalize-full-names --filter=foo   # dry-run filtered
 *   php artisan templates:normalize-full-names --filter=foo --apply
 */
class NormalizeTemplateFullNames extends Command
{
    protected $signature = 'templates:normalize-full-names
                            {--apply : Actually write the changes (default is dry-run)}
                            {--filter= : Only process templates whose current full_name contains this substring}';

    protected $description = 'Rewrite template.full_name to the canonical username/template_slug form';

    public function handle(): int
    {
        $apply  = (bool) $this->option('apply');
        $filter = (string) ($this->option('filter') ?? '');

        $query = Template::query()->with('creator');
        if ($filter !== '') {
            $query->where('full_name', 'like', '%' . $filter . '%');
        }

        $total     = $query->count();
        $changed   = 0;
        $unchanged = 0;
        $skipped   = 0;

        $this->info(($apply ? 'APPLY' : 'DRY-RUN') . " — scanning $total template(s)…");
        if ($filter !== '') {
            $this->line("Filter active: only full_name LIKE '%$filter%'");
        }
        $this->newLine();

        $query->chunk(100, function ($templates) use (&$changed, &$unchanged, &$skipped, $apply) {
            foreach ($templates as $tpl) {
                $creator = $tpl->creator;
                if (!$creator) {
                    $this->warn("  [skip] id={$tpl->id}  full_name='{$tpl->full_name}'  — no creator user");
                    $skipped++;
                    continue;
                }

                $username = $creator->username ?? $creator->name;
                $desired  = Template::buildFullName($username, $tpl->name, $tpl->id);

                if ($desired === $tpl->full_name) {
                    $unchanged++;
                    continue;
                }

                $this->line(sprintf(
                    "  [%s] id=%-5d  %-50s  →  %s",
                    $apply ? ' set' : 'plan',
                    $tpl->id,
                    $tpl->full_name,
                    $desired
                ));

                if ($apply) {
                    $tpl->full_name = $desired;
                    $tpl->saveQuietly(); // skip touching updated_at on a pure normalization
                }
                $changed++;
            }
        });

        $this->newLine();
        $this->info("Result: changed=$changed  unchanged=$unchanged  skipped=$skipped  total=$total");

        if (!$apply && $changed > 0) {
            $this->newLine();
            $this->warn('Dry-run only — nothing was written. Re-run with --apply to persist.');
        }

        return self::SUCCESS;
    }
}
