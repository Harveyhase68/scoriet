

<?php $__env->startSection('content'); ?>
<div class="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
    <div class="sm:flex sm:items-center">
        <div class="sm:flex-auto">
            <h1 class="text-3xl font-bold text-blue-400 mb-2">Pages Management</h1>
            <p class="text-gray-300">Manage your static pages content.</p>
        </div>
        <div class="sm:flex-none">
            <a href="<?php echo e(route('admin.pages.create')); ?>"
               class="inline-flex items-center rounded-md bg-blue-600 px-3 py-2 text-sm font-semibold text-white shadow-sm hover:bg-blue-500 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-blue-600">
                Create New Page
            </a>
        </div>
    </div>

    <div class="mt-8 flex flex-col">
        <div class="-my-2 -mx-4 overflow-x-auto sm:-mx-6 lg:-mx-8">
            <div class="inline-block min-w-full py-2 align-middle md:px-6 lg:px-8">
                <div class="overflow-hidden shadow-lg md:rounded-lg">
                    <table class="min-w-full divide-y divide-gray-600">
                        <thead class="bg-gray-800">
                            <tr>
                                <th scope="col" class="py-3.5 pl-4 pr-3 text-left text-sm font-semibold text-white sm:pl-6">Slug</th>
                                <th scope="col" class="px-3 py-3.5 text-left text-sm font-semibold text-white">Language</th>
                                <th scope="col" class="px-3 py-3.5 text-left text-sm font-semibold text-white">Title</th>
                                <th scope="col" class="px-3 py-3.5 text-left text-sm font-semibold text-white">Status</th>
                                <th scope="col" class="relative py-3.5 pl-3 pr-4 sm:pr-6">
                                    <span class="sr-only">Actions</span>
                                </th>
                            </tr>
                        </thead>
                        <tbody class="divide-y divide-gray-700 bg-gray-900">
                            <?php $__currentLoopData = $pages; $__env->addLoop($__currentLoopData); foreach($__currentLoopData as $page): $__env->incrementLoopIndices(); $loop = $__env->getLastLoop(); ?>
                            <tr>
                                <td class="whitespace-nowrap py-4 pl-4 pr-3 text-sm font-medium text-white sm:pl-6"><?php echo e($page->slug); ?></td>
                                <td class="whitespace-nowrap px-3 py-4 text-sm text-gray-300"><?php echo e(strtoupper($page->locale)); ?></td>
                                <td class="whitespace-nowrap px-3 py-4 text-sm text-gray-300"><?php echo e($page->title); ?></td>
                                <td class="whitespace-nowrap px-3 py-4 text-sm text-gray-300">
                                    <?php if($page->is_active): ?>
                                        <span class="inline-flex rounded-full bg-green-800 px-2 text-xs font-semibold leading-5 text-green-200">Active</span>
                                    <?php else: ?>
                                        <span class="inline-flex rounded-full bg-red-800 px-2 text-xs font-semibold leading-5 text-red-200">Inactive</span>
                                    <?php endif; ?>
                                </td>
                                <td class="relative whitespace-nowrap py-4 pl-3 pr-4 text-right text-sm font-medium sm:pr-6">
                                    <a href="<?php echo e(route('admin.pages.edit', $page)); ?>" class="text-blue-400 hover:text-blue-300">Edit</a>
                                </td>
                            </tr>
                            <?php endforeach; $__env->popLoop(); $loop = $__env->getLastLoop(); ?>
                        </tbody>
                    </table>
                </div>
            </div>
        </div>
    </div>
</div>
<?php $__env->stopSection(); ?>
<?php echo $__env->make('layouts.static', array_diff_key(get_defined_vars(), ['__data' => 1, '__path' => 1]))->render(); ?><?php /**PATH C:\wamp\www\scoriet\resources\views/admin/pages/index.blade.php ENDPATH**/ ?>