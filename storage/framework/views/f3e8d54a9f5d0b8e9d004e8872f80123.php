<!DOCTYPE html>
<html lang="en">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title><?php echo e(__('project-invitationbladephp6')); ?><?php echo e($project->name); ?></title>
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
        .project-info {
            background: #f3f4f6;
            border-left: 4px solid #2563eb;
            padding: 20px;
            margin: 20px 0;
            border-radius: 0 6px 6px 0;
        }
        .project-name {
            font-size: 20px;
            font-weight: bold;
            color: #1f2937;
            margin-bottom: 10px;
        }
        .message-box {
            background: #fef3c7;
            border: 1px solid #f59e0b;
            border-radius: 6px;
            padding: 15px;
            margin: 20px 0;
        }
        .actions {
            text-align: center;
            margin: 30px 0;
        }
        .btn {
            display: inline-block;
            padding: 12px 24px;
            margin: 0 10px;
            text-decoration: none;
            border-radius: 6px;
            font-weight: 600;
            font-size: 16px;
            transition: all 0.2s ease;
        }
        .btn-accept {
            background: #10b981;
            color: white;
        }
        .btn-accept:hover {
            background: #059669;
            color: white;
        }
        .btn-decline {
            background: #ef4444;
            color: white;
        }
        .btn-decline:hover {
            background: #dc2626;
            color: white;
        }
        .footer {
            margin-top: 40px;
            padding-top: 20px;
            border-top: 1px solid #e5e7eb;
            font-size: 14px;
            color: #6b7280;
            text-align: center;
        }
        .expiry {
            color: #f59e0b;
            font-weight: 600;
            margin-top: 20px;
        }
        .security-note {
            background: #fef2f2;
            border: 1px solid #fecaca;
            border-radius: 6px;
            padding: 15px;
            margin: 20px 0;
            font-size: 14px;
            color: #7f1d1d;
        }
    </style>
</head>
<body>
    <div class="container">
        <div class="header">
            <div class="logo">🚀 Scoriet</div>
            <h1 class="title"><?php echo e(__('project-invitationbladephp116')); ?></h1>
        </div>

        <p><?php echo e(__('project-invitationbladephp119')); ?></p>

        <p><strong><?php echo e($inviter->name); ?></strong> (<?php echo e($inviter->email); ?>)<?php echo e(__('project-invitationbladephp121')); ?></p>

        <div class="project-info">
            <div class="project-name"><?php echo e($project->name); ?></div>
            <?php if($project->description): ?>
                <p style="margin: 5px 0; color: #6b7280;"><?php echo e($project->description); ?></p>
            <?php endif; ?>
            <p style="margin: 5px 0; font-size: 14px; color: #6b7280;">
                <?php echo e(__('project-invitationbladephp129')); ?><strong><?php echo e(ucfirst($invitation->role)); ?></strong>
            </p>
        </div>

        <?php if($invitation->message): ?>
            <div class="message-box">
                <strong><?php echo e(__('project-invitationbladephp135')); ?><?php echo e($inviter->name); ?>:</strong><br>
                "<?php echo e($invitation->message); ?>"
            </div>
        <?php endif; ?>

        <div class="actions">
            <a href="<?php echo e($acceptUrl); ?>" class="btn btn-accept"><?php echo e(__('project-invitationbladephp141')); ?></a>
            <a href="<?php echo e($declineUrl); ?>" class="btn btn-decline"><?php echo e(__('project-invitationbladephp142')); ?></a>
        </div>

        <div class="expiry">
            <?php echo e(__('project-invitationbladephp146')); ?><?php echo e($expiresAt->format('F j, Y \a\t g:i A')); ?>

        </div>

        <div class="security-note">
            <strong><?php echo e(__('project-invitationbladephp150')); ?></strong><?php echo e(__('project-invitationbladephp150_2')); ?><?php echo e($invitation->invited_email); ?>. 
            <?php echo e(__('project-invitationbladephp151')); ?>

        </div>

        <div class="footer">
            <p>
                <?php echo e(__('project-invitationbladephp156')); ?><strong>Scoriet</strong><?php echo e(__('project-invitationbladephp156_2')); ?><br>
                <?php echo e(__('project-invitationbladephp157')); ?><?php echo e($inviter->name); ?><?php echo e(__('project-invitationbladephp157_2')); ?>

            </p>
            <p style="margin-top: 15px; font-size: 12px; color: #9ca3af;">
                <?php echo e(__('project-invitationbladephp160')); ?><?php echo e($invitation->id); ?> | Token: <?php echo e(substr($invitation->token, 0, 8)); ?>...
            </p>
        </div>
    </div>
</body>
</html><?php /**PATH C:\wamp\www\scoriet\resources\views/emails/project-invitation.blade.php ENDPATH**/ ?>