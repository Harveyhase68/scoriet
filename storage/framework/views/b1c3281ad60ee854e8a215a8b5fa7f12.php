<?php $__env->startSection('title', $page->title); ?>

<?php $__env->startSection('content'); ?>
<div class="max-w-4xl mx-auto">
    <h1 class="text-3xl font-bold text-blue-400 mb-6"><?php echo e($page->title); ?></h1>

    <div class="bg-gray-800 dark:bg-gray-900 rounded-lg shadow-lg p-8">
        <div class="prose prose-lg prose-gray dark:prose-invert max-w-none text-gray-300">
            <?php echo $page->content; ?>

        </div>
    </div>
</div>
<?php $__env->stopSection(); ?>
<?php echo $__env->make('layouts.static', array_diff_key(get_defined_vars(), ['__data' => 1, '__path' => 1]))->render(); ?><?php /**PATH C:\wamp\www\scoriet\resources\views/pages/show.blade.php ENDPATH**/ ?>