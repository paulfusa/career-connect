<script lang="ts">
    import { field, glassPanel, label, primaryButton } from '$lib/ui';
    import type { ActionData, PageData } from './$types';
    import SuggestInput from '$lib/components/SuggestInput.svelte';
    import { searchCities, searchCompanies } from '$lib/suggest.svelte';

    let {
        data,
        form
    }: {
        data: PageData;
        form: ActionData | null;
    } = $props();
</script>

<svelte:head>
    <title>Company Profile · CareerConnect</title>
</svelte:head>

<div class="space-y-5 md:mt-14">
    <div>
        <h1 class="font-display text-2xl font-semibold">
            Company Profile
        </h1>
        <p class="mt-2 text-sm text-ink/60">
            Manage your company information so job seekers
            can learn more about your organization.
        </p>
    </div>

        {#if form?.message}
        <p
            role="status"
            class={form.success ? 'text-green-600' : 'text-red-600'}
        >
            {form.message}
        </p>
        {/if}

    <form method="POST" action="?/save" class="{glassPanel} space-y-5 p-6">
        <label class="block">
            <span class={label}>Company Name</span>
            
            <SuggestInput
                name="name"
                search={searchCompanies}
                value={form?.name ?? data.company?.name ?? ''}
                required
                maxlength={150}
                placeholder="Start typing a company name"
                class={field}
            />

        </label>

        <label class="block">
            <span class={label}>Description</span>

            <textarea
                name="description"
                required
                rows="5"
                maxlength="3000"
                placeholder="Tell job seekers about your company"
                class={field}
                value={form?.description ?? data.company?.description ?? ''}
            ></textarea>

        </label>

        <label class="block">
            <span class={label}>Location</span>
            
            <SuggestInput
                name="location"
                search={searchCities}
                value={form?.location ?? data.company?.location ?? ''}
                required
                maxlength={200}
                placeholder="Start typing a city"
                class={field}
            />

        </label>

        <label class="block">
            <span class={label}>Website</span>
            <input
                type="url"
                name="website"
                placeholder="https://example.com"
                class={field}
                value={form?.website ?? data.company?.website ?? ''}
            />
        </label>

        <button type="submit" class={primaryButton}>
        Save Company Profile
        </button>
    </form>
</div>
