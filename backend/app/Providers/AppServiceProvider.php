<?php

namespace App\Providers;

use Illuminate\Support\ServiceProvider;

class AppServiceProvider extends ServiceProvider
{
    /**
     * Register any application services.
     */
    public function register(): void
    {
        //
    }

    /**
     * Bootstrap any application services.
     */
    public function boot(): void
    {
        if (app()->runningInConsole()) {
            $serveCommand = \Illuminate\Foundation\Console\ServeCommand::class;

            $serveCommand::$passthroughVariables = array_values(array_unique(array_merge(
                $serveCommand::$passthroughVariables,
                ['TEMP', 'TMP']
            )));
        }
    }
}
