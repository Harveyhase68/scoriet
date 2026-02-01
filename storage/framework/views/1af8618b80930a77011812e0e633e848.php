<!DOCTYPE html>
<html lang="de">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>Ihre Abonnements - Scoriet</title>
    <style>
        body {
            font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Helvetica, Arial, sans-serif;
            line-height: 1.6;
            color: #333;
            max-width: 600px;
            margin: 0 auto;
            padding: 20px;
            background-color: #f8f9fa;
        }
        .container {
            background: white;
            border-radius: 10px;
            padding: 40px;
            box-shadow: 0 4px 6px rgba(0, 0, 0, 0.1);
        }
        .header {
            text-align: center;
            margin-bottom: 30px;
        }
        .logo {
            font-size: 28px;
            font-weight: bold;
            color: #2563eb;
            margin-bottom: 10px;
        }
        .title {
            color: #1f2937;
            font-size: 24px;
            margin-bottom: 20px;
        }
        .summary-box {
            background: #f3f4f6;
            border-radius: 8px;
            padding: 15px 20px;
            margin: 20px 0;
            text-align: center;
        }
        .summary-count {
            font-size: 36px;
            font-weight: bold;
            color: #1f2937;
        }
        .summary-label {
            color: #6b7280;
            font-size: 14px;
        }

        /* Section styles */
        .section {
            margin: 25px 0;
            border-radius: 10px;
            overflow: hidden;
        }
        .section-header {
            padding: 15px 20px;
            font-weight: 600;
            display: flex;
            align-items: center;
            gap: 10px;
        }
        .section-content {
            padding: 0 20px 20px;
        }

        /* Expired section - Red */
        .section-expired {
            background: linear-gradient(135deg, #fef2f2 0%, #fee2e2 100%);
            border-left: 4px solid #dc2626;
        }
        .section-expired .section-header {
            color: #991b1b;
            background: rgba(220, 38, 38, 0.1);
        }

        /* Final warning section - Orange */
        .section-final {
            background: linear-gradient(135deg, #fff7ed 0%, #ffedd5 100%);
            border-left: 4px solid #ea580c;
        }
        .section-final .section-header {
            color: #9a3412;
            background: rgba(234, 88, 12, 0.1);
        }

        /* Warning section - Yellow */
        .section-warning {
            background: linear-gradient(135deg, #fefce8 0%, #fef3c7 100%);
            border-left: 4px solid #ca8a04;
        }
        .section-warning .section-header {
            color: #854d0e;
            background: rgba(202, 138, 4, 0.1);
        }

        /* Subscription item */
        .subscription-item {
            background: white;
            border-radius: 8px;
            padding: 15px;
            margin: 10px 0;
            box-shadow: 0 1px 3px rgba(0, 0, 0, 0.1);
        }
        .subscription-name {
            font-weight: 600;
            color: #1f2937;
            margin-bottom: 5px;
        }
        .subscription-details {
            font-size: 14px;
            color: #6b7280;
        }
        .subscription-days {
            display: inline-block;
            padding: 2px 8px;
            border-radius: 4px;
            font-size: 12px;
            font-weight: 600;
            margin-left: 10px;
        }
        .days-expired {
            background: #fee2e2;
            color: #dc2626;
        }
        .days-urgent {
            background: #ffedd5;
            color: #ea580c;
        }
        .days-warning {
            background: #fef3c7;
            color: #ca8a04;
        }

        /* Bonus box */
        .bonus-box {
            background: linear-gradient(135deg, #d1fae5 0%, #a7f3d0 100%);
            border: 2px solid #10b981;
            border-radius: 10px;
            padding: 20px;
            margin: 25px 0;
            text-align: center;
        }
        .bonus-title {
            font-size: 16px;
            font-weight: bold;
            color: #047857;
            margin-bottom: 5px;
        }
        .bonus-days {
            font-size: 28px;
            font-weight: bold;
            color: #059669;
        }
        .bonus-note {
            font-size: 13px;
            color: #059669;
            margin-top: 5px;
        }

        /* Actions */
        .actions {
            text-align: center;
            margin: 30px 0;
        }
        .btn {
            display: inline-block;
            padding: 16px 32px;
            text-decoration: none;
            border-radius: 8px;
            font-weight: 600;
            font-size: 18px;
            transition: all 0.2s ease;
        }
        .btn-primary {
            background: linear-gradient(135deg, #3b82f6 0%, #2563eb 100%);
            color: white;
        }
        .btn-primary:hover {
            background: linear-gradient(135deg, #2563eb 0%, #1d4ed8 100%);
            color: white;
        }

        /* Footer */
        .footer {
            margin-top: 40px;
            padding-top: 20px;
            border-top: 1px solid #e5e7eb;
            font-size: 14px;
            color: #6b7280;
            text-align: center;
        }

        /* Cost info */
        .cost-info {
            text-align: center;
            color: #6b7280;
            font-size: 14px;
            margin-top: 10px;
        }
    </style>
</head>
<body>
    <div class="container">
        <div class="header">
            <div class="logo">Scoriet</div>
            <?php if($urgencyLevel === 'expired'): ?>
                <h1 class="title" style="color: #dc2626;">Abonnements abgelaufen</h1>
            <?php elseif($urgencyLevel === 'final'): ?>
                <h1 class="title" style="color: #ea580c;">Dringende Erinnerung</h1>
            <?php else: ?>
                <h1 class="title">Ihre Abonnements laufen bald ab</h1>
            <?php endif; ?>
        </div>

        <p>Hallo <?php echo e($user->name); ?>,</p>

        <p>
            <?php if($totalCount === 1): ?>
                eines Ihrer Abonnements benötigt Ihre Aufmerksamkeit:
            <?php else: ?>
                <?php echo e($totalCount); ?> Ihrer Abonnements benötigen Ihre Aufmerksamkeit:
            <?php endif; ?>
        </p>

        
        <?php if(count($expiredSubscriptions) > 0): ?>
            <div class="section section-expired">
                <div class="section-header">
                    <span style="font-size: 20px;">&#x26A0;</span>
                    Abgelaufen (<?php echo e(count($expiredSubscriptions)); ?>)
                </div>
                <div class="section-content">
                    <?php $__currentLoopData = $expiredSubscriptions; $__env->addLoop($__currentLoopData); foreach($__currentLoopData as $sub): $__env->incrementLoopIndices(); $loop = $__env->getLastLoop(); ?>
                        <div class="subscription-item">
                            <div class="subscription-name">
                                <?php echo e($sub['displayName']); ?>

                                <span class="subscription-days days-expired">Abgelaufen</span>
                            </div>
                            <div class="subscription-details">
                                Abgelaufen am: <?php echo e($sub['expiredAt']); ?>

                            </div>
                        </div>
                    <?php endforeach; $__env->popLoop(); $loop = $__env->getLastLoop(); ?>
                </div>
            </div>
        <?php endif; ?>

        
        <?php if(count($finalSubscriptions) > 0): ?>
            <div class="section section-final">
                <div class="section-header">
                    <span style="font-size: 20px;">&#x23F0;</span>
                    Läuft in Kürze ab (<?php echo e(count($finalSubscriptions)); ?>)
                </div>
                <div class="section-content">
                    <?php $__currentLoopData = $finalSubscriptions; $__env->addLoop($__currentLoopData); foreach($__currentLoopData as $sub): $__env->incrementLoopIndices(); $loop = $__env->getLastLoop(); ?>
                        <div class="subscription-item">
                            <div class="subscription-name">
                                <?php echo e($sub['displayName']); ?>

                                <span class="subscription-days days-urgent"><?php echo e($sub['daysUntilExpiry']); ?> <?php echo e($sub['daysUntilExpiry'] == 1 ? 'Tag' : 'Tage'); ?></span>
                            </div>
                            <div class="subscription-details">
                                Läuft ab am: <?php echo e($sub['expiresAt']); ?>

                            </div>
                        </div>
                    <?php endforeach; $__env->popLoop(); $loop = $__env->getLastLoop(); ?>
                </div>
            </div>
        <?php endif; ?>

        
        <?php if(count($warningSubscriptions) > 0): ?>
            <div class="section section-warning">
                <div class="section-header">
                    <span style="font-size: 20px;">&#x1F514;</span>
                    Läuft bald ab (<?php echo e(count($warningSubscriptions)); ?>)
                </div>
                <div class="section-content">
                    <?php $__currentLoopData = $warningSubscriptions; $__env->addLoop($__currentLoopData); foreach($__currentLoopData as $sub): $__env->incrementLoopIndices(); $loop = $__env->getLastLoop(); ?>
                        <div class="subscription-item">
                            <div class="subscription-name">
                                <?php echo e($sub['displayName']); ?>

                                <span class="subscription-days days-warning"><?php echo e($sub['daysUntilExpiry']); ?> Tage</span>
                            </div>
                            <div class="subscription-details">
                                Läuft ab am: <?php echo e($sub['expiresAt']); ?>

                            </div>
                        </div>
                    <?php endforeach; $__env->popLoop(); $loop = $__env->getLastLoop(); ?>
                </div>
            </div>
        <?php endif; ?>

        
        <?php if(count($warningSubscriptions) > 0 || count($finalSubscriptions) > 0): ?>
            <div class="bonus-box">
                <div class="bonus-title">Frühbucher-Bonus</div>
                <p style="margin: 5px 0; color: #047857; font-size: 14px;">Verlängern Sie jetzt und erhalten Sie zusätzlich:</p>
                <div class="bonus-days">+<?php echo e($bonusDays); ?> Tage GRATIS!</div>
                <p class="bonus-note">Das entspricht einem ganzen Monat extra!</p>
            </div>
        <?php endif; ?>

        <div class="actions">
            <a href="<?php echo e($renewUrl); ?>" class="btn btn-primary">Jetzt verlängern</a>
        </div>

        <p class="cost-info">
            Die Verlängerung kostet nur <strong>50 Credits</strong> pro Abonnement für ein weiteres Jahr.
        </p>

        <div class="footer">
            <p>
                Dies ist eine automatische Nachricht von <strong>Scoriet</strong>.<br>
                Sie erhalten diese E-Mail, weil <?php echo e($totalCount === 1 ? 'ein Abonnement' : 'mehrere Abonnements'); ?> Ihre Aufmerksamkeit <?php echo e($totalCount === 1 ? 'benötigt' : 'benötigen'); ?>.
            </p>
        </div>
    </div>
</body>
</html>
<?php /**PATH C:\wamp\www\scoriet\resources\views/emails/subscription-expiry-bundled.blade.php ENDPATH**/ ?>