<template>
  <BlSiteBar v-if="chrome && chrome.bar" data-chrome>
    <template #brand>
      <a class="bl-site-bar__brand" href="#">
        <svg v-if="chrome.logo" width="24" height="24" viewBox="0 0 24 24" aria-hidden="true">
          <circle cx="12" cy="12" r="10" fill="currentColor" />
        </svg>
        {{ chrome.brand }}
      </a>
    </template>
    <template v-if="chrome.links > 0" #nav>
      <BlNavLink v-for="(l, i) in links(chrome.links)" :key="i" href="#" :current="i === 0">
        {{ l }}
      </BlNavLink>
    </template>
    <template #actions><BlAppearanceSwitch /></template>
  </BlSiteBar>
  <main id="main-content" class="bl-col st-main">
    <p v-if="!only" class="bl-annotation">
      Regression page for responsive behaviour. Open a chrome case alone with ?case=&lt;id&gt;:
      <template v-for="id in chromeCases" :key="id">
        <a :href="`?case=${id}`">{{ id }}</a
        >{{ ' ' }}
      </template>
    </p>

    <!-- D1: wrapping / intrinsic sizing -->
    <section v-if="show('readout-long')" data-case="readout-long">
      <h2 class="st-label">readout-long</h2>
      <div data-box>
        <BlReadout :value="hash" unit="milliseconds-per-sample" />
        <BlReadout value="1234567890123456789012345678901234567890" unit="kHz" />
      </div>
    </section>

    <section v-if="show('button-long')" data-case="button-long">
      <h2 class="st-label">button-long</h2>
      <div data-box>
        <BlButton>{{ hash }}</BlButton>
        <BlButton variant="secondary">{{ german }}</BlButton>
      </div>
    </section>

    <section v-if="show('button-icon-row')" data-case="button-icon-row">
      <h2 class="st-label">button-icon-row</h2>
      <div data-box style="display: flex; flex-wrap: wrap; gap: 8px">
        <BlButton v-for="n in 12" :key="n" variant="secondary" :aria-label="`Action ${n}`">
          <template #icon>
            <svg viewBox="0 0 16 16" fill="none" stroke="currentColor" stroke-width="1.5">
              <path d="M3 3l10 10M13 3L3 13" />
            </svg>
          </template>
        </BlButton>
      </div>
    </section>

    <section v-if="show('button-icon-toolbar')" data-case="button-icon-toolbar">
      <h2 class="st-label">button-icon-toolbar</h2>
      <div data-box style="display: flex; flex-wrap: nowrap; gap: 8px; overflow: hidden">
        <BlButton v-for="n in 12" :key="n" variant="ghost" :aria-label="`Tool ${n}`">
          <template #icon>
            <svg viewBox="0 0 16 16" fill="none" stroke="currentColor" stroke-width="1.5">
              <path d="M3 8h10" />
            </svg>
          </template>
        </BlButton>
      </div>
    </section>

    <section v-if="show('meter-long')" data-case="meter-long">
      <h2 class="st-label">meter-long</h2>
      <div data-box>
        <BlMeter
          :value="0.62"
          :label="german + ' ' + german"
          :value-text="hash + ' of ' + hash"
          show-value
        />
      </div>
    </section>

    <section v-if="show('progress-long')" data-case="progress-long">
      <h2 class="st-label">progress-long</h2>
      <div data-box>
        <BlProgress
          :value="0.62"
          :label="german + ' ' + german"
          :value-text="hash + ' of ' + hash"
          show-value
        />
        <BlProgress :value="null" :label="german" show-value />
      </div>
    </section>

    <section v-if="show('field-hint-url')" data-case="field-hint-url">
      <h2 class="st-label">field-hint-url</h2>
      <div data-box>
        <BlField label="Endpoint" :hint="`See ${url}`">
          <template #default="{ id, describedBy }">
            <BlInput :id="id" :aria-describedby="describedBy" model-value="" />
          </template>
        </BlField>
      </div>
    </section>

    <section v-if="show('select-long')" data-case="select-long">
      <h2 class="st-label">select-long</h2>
      <div data-box>
        <BlField v-slot="{ id }" label="Region">
          <BlSelect
            :id="id"
            model-value="long"
            :options="[
              { value: 'long', label: german + ' ' + german + ' ' + hash },
              { value: 'short', label: 'Short' }
            ]"
          />
        </BlField>
      </div>
    </section>

    <section v-if="show('segmented-long')" data-case="segmented-long">
      <h2 class="st-label">segmented-long</h2>
      <div data-box>
        <BlSegmented
          aria-label="Long labels"
          :options="[
            { value: 'a', label: 'Konfigurationsverwaltungssystem' },
            { value: 'b', label: 'Short' }
          ]"
          model-value="a"
        />
      </div>
    </section>

    <section v-if="show('link-arrow-long')" data-case="link-arrow-long">
      <h2 class="st-label">link-arrow-long</h2>
      <div data-box>
        <BlLinkArrow href="#">{{ german }}</BlLinkArrow>
      </div>
    </section>

    <section v-if="show('colophon-unbreakable')" data-case="colophon-unbreakable">
      <h2 class="st-label">colophon-unbreakable</h2>
      <div data-box>
        <BlColophon :items="['Benchlight', hash]" />
      </div>
    </section>

    <section v-if="show('prose')" data-case="prose">
      <h2 class="st-label">prose</h2>
      <div data-box>
        <BlProse>
          <h2>Informationssicherheitsmanagementsystemdokumentation</h2>
          <p>
            Inline hash <code>{{ hash }}</code> and link <a href="#">{{ url }}</a
            >.
          </p>
          <p>
            <img :src="wideImage" width="1200" height="60" alt="" />
          </p>
          <video width="1000" height="80" controls />
          <iframe title="embed" src="about:blank" width="900" height="80" />
          <blockquote>
            <p>{{ url }}</p>
          </blockquote>
          <table>
            <thead>
              <tr>
                <th>Alpha</th>
                <th>Beta</th>
                <th>Gamma</th>
                <th>Delta</th>
                <th>Epsilon</th>
              </tr>
            </thead>
            <tbody>
              <tr>
                <td>{{ hash.slice(0, 20) }}</td>
                <td>{{ hash.slice(20, 40) }}</td>
                <td>{{ hash.slice(40) }}</td>
                <td>four</td>
                <td>five</td>
              </tr>
            </tbody>
          </table>
        </BlProse>
      </div>
    </section>

    <section v-if="show('index-row-long')" data-case="index-row-long">
      <h2 class="st-label">index-row-long</h2>
      <div data-box>
        <BlIndex ruled-top>
          <BlIndexRow href="#">
            <template #meta>{{ hash }}</template>
            <template #title>{{ german }}</template>
            {{ url }}
          </BlIndexRow>
        </BlIndex>
      </div>
    </section>

    <section v-if="show('meta-hash')" data-case="meta-hash">
      <h2 class="st-label">meta-hash</h2>
      <div data-box>
        <BlMeta :items="['commit', hash]" separator />
      </div>
    </section>

    <section v-if="show('media-unbroken')" data-case="media-unbroken">
      <h2 class="st-label">media-unbroken</h2>
      <div data-box>
        <BlMedia>
          <template #figure>
            <svg viewBox="0 0 64 64" role="img" aria-label="Thumbnail">
              <rect width="64" height="64" rx="6" fill="currentColor" />
            </svg>
          </template>
          https://example.com/{{ 'a'.repeat(120) }}
          <template #aside><BlButton>Open</BlButton></template>
        </BlMedia>
      </div>
    </section>

    <section v-if="show('section-head-compound')" data-case="section-head-compound">
      <h2 class="st-label">section-head-compound</h2>
      <div data-box>
        <BlSectionHead eyebrow="Section" :heading="german" ruled />
      </div>
    </section>

    <section v-if="show('display-xl')" data-case="display-xl">
      <h2 class="st-label">display-xl</h2>
      <div data-box>
        <p class="bl-display bl-display--xl">INFRASTRUCTURE</p>
      </div>
    </section>

    <section v-if="show('telemetry-long')" data-case="telemetry-long">
      <h2 class="st-label">telemetry-long</h2>
      <div data-box>
        <BlTelemetry>
          <BlTelemetryCell label="Checksum">{{ hash }}</BlTelemetryCell>
          <BlTelemetryCell label="Endpoint">{{ url }}</BlTelemetryCell>
          <BlTelemetryCell label="Status">Konfigurationsverwaltung</BlTelemetryCell>
        </BlTelemetry>
      </div>
    </section>

    <section v-if="show('spec-row-long')" data-case="spec-row-long">
      <h2 class="st-label">spec-row-long</h2>
      <div data-box>
        <BlSpecPanel>
          <BlSpecRow label="Netzwerkkonfigurationsschnittstelle" :value="hash" />
        </BlSpecPanel>
      </div>
    </section>

    <!-- D2: container-aware / em based -->
    <section v-if="show('telemetry-4')" data-case="telemetry-4">
      <h2 class="st-label">telemetry-4</h2>
      <div data-box>
        <BlTelemetry>
          <BlTelemetryCell v-for="n in 4" :key="n" :label="`Channel ${n}`">
            -{{ n }}2.5 dBFS
          </BlTelemetryCell>
        </BlTelemetry>
      </div>
    </section>

    <section v-if="show('telemetry-6')" data-case="telemetry-6">
      <h2 class="st-label">telemetry-6</h2>
      <div data-box>
        <BlTelemetry>
          <BlTelemetryCell v-for="n in 6" :key="n" :label="`Channel ${n}`">
            -{{ n }}2.5 dBFS
          </BlTelemetryCell>
        </BlTelemetry>
      </div>
    </section>

    <section v-if="show('spec-panel')" data-case="spec-panel">
      <h2 class="st-label">spec-panel</h2>
      <div data-box>
        <BlSpecPanel
          :rows="[
            { label: 'Sample rate', value: '48 kHz' },
            { label: 'Firmware', value: hash.slice(0, 24) },
            { label: 'Docs', value: 'benchlight.dev/docs', href: 'https://example.com' }
          ]"
        />
      </div>
    </section>

    <section v-if="show('index-grid')" data-case="index-grid">
      <h2 class="st-label">index-grid</h2>
      <div data-box>
        <BlIndex grid>
          <BlIndexRow v-for="n in 4" :key="n" href="#">
            <template #meta>2026-0{{ n }}-01</template>
            <template #title>Entry number {{ n }}</template>
            A short description of the entry.
          </BlIndexRow>
        </BlIndex>
      </div>
    </section>

    <section v-if="show('host-flex-telemetry')" data-case="host-flex-telemetry">
      <h2 class="st-label">host-flex-telemetry</h2>
      <div data-box>
        <div data-host style="display: flex">
          <BlTelemetry>
            <BlTelemetryCell v-for="n in 3" :key="n" :label="`Channel ${n}`"
              >-{{ n }}2.5 dBFS</BlTelemetryCell
            >
          </BlTelemetry>
        </div>
      </div>
    </section>

    <section v-if="show('host-flex-spec-panel')" data-case="host-flex-spec-panel">
      <h2 class="st-label">host-flex-spec-panel</h2>
      <div data-box>
        <div data-host style="display: flex">
          <BlSpecPanel
            :rows="[
              { label: 'Sample rate', value: '48 kHz' },
              { label: 'Docs', value: 'benchlight.dev/docs' }
            ]"
          />
        </div>
      </div>
    </section>

    <section v-if="show('host-flex-colophon')" data-case="host-flex-colophon">
      <h2 class="st-label">host-flex-colophon</h2>
      <div data-box>
        <div data-host style="display: flex">
          <BlColophon :items="['Benchlight', 'Built 2026-10-04', 'MIT licence']" />
        </div>
      </div>
    </section>

    <section v-if="show('host-inline-telemetry')" data-case="host-inline-telemetry">
      <h2 class="st-label">host-inline-telemetry</h2>
      <div data-box>
        <div data-host style="display: inline-block">
          <BlTelemetry>
            <BlTelemetryCell v-for="n in 3" :key="n" :label="`Channel ${n}`"
              >-{{ n }}2.5 dBFS</BlTelemetryCell
            >
          </BlTelemetry>
        </div>
      </div>
    </section>

    <section v-if="show('host-inline-spec-panel')" data-case="host-inline-spec-panel">
      <h2 class="st-label">host-inline-spec-panel</h2>
      <div data-box>
        <div data-host style="display: inline-block">
          <BlSpecPanel
            :rows="[
              { label: 'Sample rate', value: '48 kHz' },
              { label: 'Docs', value: 'benchlight.dev/docs' }
            ]"
          />
        </div>
      </div>
    </section>

    <section v-if="show('host-inline-colophon')" data-case="host-inline-colophon">
      <h2 class="st-label">host-inline-colophon</h2>
      <div data-box>
        <div data-host style="display: inline-block">
          <BlColophon :items="['Benchlight', 'Built 2026-10-04', 'MIT licence']" />
        </div>
      </div>
    </section>

    <section v-if="show('link-arrow-short')" data-case="link-arrow-short">
      <h2 class="st-label">link-arrow-short</h2>
      <div data-box>
        <BlLinkArrow href="#">Go</BlLinkArrow>
      </div>
    </section>

    <section v-if="show('prev-next-long')" data-case="prev-next-long">
      <h2 class="st-label">prev-next-long</h2>
      <div data-box>
        <BlPrevNext
          :prev="{ href: '#', title: german + ' ' + german }"
          :next="{ href: '#', title: hash }"
        />
      </div>
    </section>

    <section v-if="show('colophon-narrow')" data-case="colophon-narrow">
      <h2 class="st-label">colophon-narrow</h2>
      <div data-box>
        <BlColophon :items="['Benchlight', 'Built 2026-10-04', 'MIT licence', 'Made on a bench']">
          <template #actions><BlAppearanceSwitch /></template>
        </BlColophon>
      </div>
    </section>

    <section v-if="show('section-head-actions')" data-case="section-head-actions">
      <h2 class="st-label">section-head-actions</h2>
      <div data-box>
        <BlSectionHead eyebrow="Archive" heading="All entries" ruled>
          <template #actions>
            <BlLinkArrow href="#">Browse the complete archive of every note</BlLinkArrow>
          </template>
        </BlSectionHead>
      </div>
    </section>

    <section v-if="show('section-head-bar-actions')" data-case="section-head-bar-actions">
      <h2 class="st-label">section-head-bar-actions</h2>
      <div data-box>
        <BlSectionHead bar eyebrow="Archive of everything">
          <template #actions>
            <BlLinkArrow href="#">Browse the complete archive of every note</BlLinkArrow>
          </template>
        </BlSectionHead>
      </div>
    </section>

    <!-- D4: vue-level behaviour -->
    <section v-if="show('msg-link')" data-case="msg-link">
      <h2 class="st-label">msg-link</h2>
      <div data-box>
        <BlMsg tone="danger">
          Upload failed, see <a href="#">the troubleshooting guide</a> or run
          <code>bun run build</code> again.
        </BlMsg>
      </div>
    </section>

    <section v-if="show('range-long')" data-case="range-long">
      <h2 class="st-label">range-long</h2>
      <div data-box>
        <BlRange
          :model-value="40"
          aria-label="Gain"
          :format="(v: number) => `${v.toFixed(3)} decibels relative to full scale`"
        />
      </div>
    </section>

    <section v-if="show('segmented-12')" data-case="segmented-12">
      <h2 class="st-label">segmented-12</h2>
      <div data-box>
        <BlSegmented aria-label="Twelve" :options="twelve" model-value="o1" />
      </div>
    </section>

    <section v-if="show('meta-sep')" data-case="meta-sep">
      <h2 class="st-label">meta-sep</h2>
      <div data-box>
        <BlMeta
          :items="[
            'Benchlight',
            'design system',
            'version 0.4.0',
            'released',
            '2026-10-04',
            'MIT',
            'personal',
            'projects'
          ]"
          separator
        />
      </div>
    </section>

    <section v-if="show('log-scale')" data-case="log-scale">
      <h2 class="st-label">log-scale</h2>
      <div data-box>
        <BlLog :lines="['boot ok', 'link up 1000 Mbps', 'ready']" />
      </div>
    </section>

    <section v-if="show('eq-settle')" data-case="eq-settle">
      <h2 class="st-label">eq-settle</h2>
      <div data-box>
        <BlEqBars :active="eqActive" />
        <BlButton variant="secondary" @click="eqActive = !eqActive">Toggle EQ</BlButton>
      </div>
    </section>

    <section v-if="show('marquee-glide')" data-case="marquee-glide">
      <h2 class="st-label">marquee-glide</h2>
      <div data-box style="inline-size: 12rem">
        <BlMarquee title="Marquee">
          <span>{{ marqueeText }}</span>
        </BlMarquee>
        <BlButton variant="secondary" @click="marqueeText = 'Short'">Shorten</BlButton>
      </div>
    </section>

    <!-- Tables -->
    <section v-if="show('table-wide')" data-case="table-wide">
      <h2 class="st-label">table-wide</h2>
      <div data-box>
        <BlTable caption="Wide table" :columns="wideColumns" :rows="wideRows" row-key="c1" />
      </div>
    </section>

    <section v-if="show('table-url')" data-case="table-url">
      <h2 class="st-label">table-url</h2>
      <div data-box>
        <BlTable caption="Unbroken URL" :columns="urlColumns" :rows="urlRows" row-key="id" />
      </div>
    </section>

    <section v-if="show('table-long-text')" data-case="table-long-text">
      <h2 class="st-label">table-long-text</h2>
      <div data-box>
        <BlTable caption="Long log text" :columns="logColumns" :rows="logRows" row-key="id" />
      </div>
    </section>

    <section v-if="show('table-scroll')" data-case="table-scroll">
      <h2 class="st-label">table-scroll</h2>
      <div data-box>
        <BlTable
          scroll
          caption="Wide scroll table"
          :columns="wideColumns"
          :rows="wideRows"
          row-key="c1"
        />
      </div>
    </section>

    <section v-if="show('table-scroll-primary')" data-case="table-scroll-primary">
      <h2 class="st-label">table-scroll-primary</h2>
      <div data-box>
        <BlTable
          scroll
          caption="Scroll table, primary column four"
          :columns="primaryColumns"
          :rows="wideRows"
          row-key="c1"
        />
      </div>
    </section>

    <section v-if="show('table-footer')" data-case="table-footer">
      <h2 class="st-label">table-footer</h2>
      <div data-box>
        <BlTable caption="Totals" :columns="footerColumns" :rows="footerRows" row-key="name" />
      </div>
    </section>

    <section v-if="show('table-actions')" data-case="table-actions">
      <h2 class="st-label">table-actions</h2>
      <div data-box>
        <BlTable
          compact
          caption="Row links"
          :columns="footerColumns"
          :rows="footerRows"
          row-key="name"
          :row-link="() => ({ href: '#row' })"
        />
      </div>
    </section>

    <section v-if="show('table-sort4')" data-case="table-sort4">
      <h2 class="st-label">table-sort4</h2>
      <div data-box>
        <BlTable
          caption="Four sortable columns"
          :columns="sort4Columns"
          :rows="footerRows"
          row-key="name"
        />
      </div>
    </section>

    <section v-if="show('pagination-many')" data-case="pagination-many">
      <h2 class="st-label">pagination-many</h2>
      <div data-box>
        <BlPagination :total="1000" :page-size="10" :page="50" aria-label="Many pages" />
      </div>
    </section>

    <section v-if="show('host-flex-table')" data-case="host-flex-table">
      <h2 class="st-label">host-flex-table</h2>
      <div data-box>
        <div data-host style="display: flex">
          <BlTable caption="Flex host" :columns="footerColumns" :rows="footerRows" row-key="name" />
        </div>
      </div>
    </section>

    <section v-if="show('host-grid-table')" data-case="host-grid-table">
      <h2 class="st-label">host-grid-table</h2>
      <div data-box>
        <div data-host style="display: grid; grid-template-columns: 1fr">
          <div style="min-inline-size: 0">
            <BlTable caption="Grid host" :columns="wideColumns" :rows="wideRows" row-key="c1" />
          </div>
        </div>
      </div>
    </section>

    <section v-if="show('host-inline-table')" data-case="host-inline-table">
      <h2 class="st-label">host-inline-table</h2>
      <div data-box>
        <div data-host style="display: inline-block">
          <BlTable
            caption="Inline host"
            :columns="footerColumns"
            :rows="footerRows"
            row-key="name"
          />
        </div>
      </div>
    </section>

    <section v-if="show('toggle-long')" data-case="toggle-long">
      <h2 class="st-label">toggle-long</h2>
      <div data-box>
        <BlToggle
          :model-value="true"
          label="Automatically reconnect to Donaudampfschifffahrtsgesellschaftskapitänsmütze networks"
          hint="https://example.com/a/really/long/unbroken/path/that/must/wrap/inside/the/box"
        />
      </div>
    </section>

    <section v-if="show('disclosure-long')" data-case="disclosure-long">
      <h2 class="st-label">disclosure-long</h2>
      <div data-box>
        <BlDisclosure
          :summary="`${'Why does this summary run on for so many words '.repeat(3)}and ends in https://example.com/${'a'.repeat(80)}`"
          open
        >
          <p>https://example.com/{{ 'b'.repeat(120) }}</p>
        </BlDisclosure>
      </div>
    </section>

    <section v-if="show('dialog-long')" data-case="dialog-long">
      <h2 class="st-label">dialog-long</h2>
      <BlDialog :open="true" :title="dialogTitle">
        <p v-for="n in 60" :key="n">Paragraph {{ n }} of a body long enough to scroll.</p>
      </BlDialog>
    </section>

    <section v-if="show('toggle-rtl')" data-case="toggle-rtl">
      <h2 class="st-label">toggle-rtl</h2>
      <div data-box dir="rtl">
        <BlToggle :model-value="true" label="تشغيل" />
        <BlToggle :model-value="false" label="إيقاف" />
      </div>
    </section>

    <section v-if="show('checkbox-long')" data-case="checkbox-long">
      <h2 class="st-label">checkbox-long</h2>
      <div data-box>
        <BlCheckbox
          :model-value="true"
          :label="`Include ${german} in every export`"
          :hint="url"
          :error="`Unknown key ${hash}`"
        />
        <BlCheckbox :model-value="false" :indeterminate="true" label="Partly selected" />
      </div>
    </section>

    <section v-if="show('radio-long')" data-case="radio-long">
      <h2 class="st-label">radio-long</h2>
      <div data-box>
        <BlRadioGroup
          model-value="a"
          :legend="`${german} ${german}`"
          :hint="url"
          :error="`Unknown value ${hash}`"
        >
          <BlRadio :label="`${german} first option`" value="a" :hint="url" />
          <BlRadio label="Second" value="b" />
        </BlRadioGroup>
        <BlRadioGroup model-value="x" :legend="german" class="bl-fieldset--inline">
          <BlRadio
            v-for="n in 6"
            :key="n"
            :label="`Option ${german.slice(0, n * 6)}`"
            :value="`x${n}`"
          />
        </BlRadioGroup>
      </div>
    </section>

    <section v-if="show('textarea-error')" data-case="textarea-error">
      <h2 class="st-label">textarea-error</h2>
      <div data-box>
        <BlField :label="german" :hint="url" :error="`Unknown token ${hash}`">
          <BlTextarea :model-value="hash" />
        </BlField>
        <BlToggle :model-value="false" label="Accept" :error="`Rejected by ${url}`" />
      </div>
    </section>

    <section v-if="show('toast-six')" data-case="toast-six">
      <h2 class="st-label">toast-six</h2>
    </section>

    <!-- The dialog/toast seam: same-tick close + toast, a sheet's footer, an action that opens a dialog. -->
    <section v-if="show('dialog-toast')" data-case="dialog-toast">
      <h2 class="st-label">dialog-toast</h2>
      <div data-box>
        <BlButton variant="secondary" @click="sheetOpen = true">Edit item</BlButton>
        <BlButton
          variant="secondary"
          @click="
            toast({
              message: 'Update ready',
              action: { label: 'Details', onClick: () => (detailsOpen = true) }
            })
          "
        >
          Notify
        </BlButton>
      </div>
      <BlDialog
        v-model:open="sheetOpen"
        title="Edit item"
        @update:open="sheetLog.push(`update:${$event}`)"
        @close="sheetLog.push(`close:${$event.reason}`)"
      >
        <BlButton variant="ghost" @click="toast({ message: 'Copied', duration: 0 })">Copy</BlButton>
        <BlButton variant="ghost" @click="reopen">Reopen</BlButton>
        <template #footer>
          <BlButton variant="secondary" @click="sheetOpen = false">Cancel</BlButton>
          <BlButton @click="save">Save</BlButton>
        </template>
      </BlDialog>
      <!-- Emits of the Edit item dialog, for the same-task close and reopen test. -->
      <p hidden data-log>{{ sheetLog.join(' ') }}</p>
      <BlDialog v-model:open="detailsOpen" title="Update details">
        <p>Version notes.</p>
      </BlDialog>
    </section>

    <!-- CSS-only markup with the panel wrapped in a form, the no-JS close path. -->
    <section v-if="show('dialog-form')" data-case="dialog-form">
      <h2 class="st-label">dialog-form</h2>
      <div data-box>
        <button type="button" class="bl-btn bl-btn--secondary" @click="formDialog?.showModal()">
          Open form dialog
        </button>
      </div>
      <dialog ref="formDialog" class="bl-dialog" aria-labelledby="st-form-title">
        <form method="dialog">
          <div class="bl-dialog__panel">
            <div class="bl-dialog__head">
              <h2 id="st-form-title" class="bl-dialog__title">Form dialog</h2>
            </div>
            <div class="bl-dialog__body">A panel inside a form.</div>
            <div class="bl-dialog__foot">
              <button class="bl-btn" value="ok">OK</button>
            </div>
          </div>
        </form>
      </dialog>
    </section>

    <!-- D3: page chrome; each rendered alone via ?case=<id> -->
    <template v-if="chrome">
      <div v-for="n in 12" :key="n" class="st-filler">Filler line {{ n }}</div>
    </template>
  </main>

  <BlTabBar v-if="chrome && chrome.tabs.length" data-chrome>
    <BlTabBarItem v-for="(t, i) in chrome.tabs" :key="i" href="#" :current="i === 0">
      <template #icon>
        <svg viewBox="0 0 16 16"><circle cx="8" cy="8" r="6" fill="currentColor" /></svg>
      </template>
      {{ t }}
    </BlTabBarItem>
  </BlTabBar>
  <BlToaster v-if="show('toast-six') || show('dialog-toast')" />
</template>

<script setup lang="ts">
  defineOptions({ name: 'StressPage' })
  import {
    BlAppearanceSwitch,
    BlButton,
    BlCheckbox,
    BlColophon,
    BlEqBars,
    BlField,
    BlIndex,
    BlIndexRow,
    BlInput,
    BlLinkArrow,
    BlLog,
    BlMarquee,
    BlMedia,
    BlMeta,
    BlMeter,
    BlProgress,
    BlMsg,
    BlNavLink,
    BlPrevNext,
    BlProse,
    BlRadio,
    BlRadioGroup,
    BlRange,
    BlReadout,
    BlSectionHead,
    BlSegmented,
    BlSelect,
    BlSiteBar,
    BlSpecPanel,
    BlSpecRow,
    BlTabBar,
    BlPagination,
    BlTable,
    BlTextarea,
    BlToggle,
    BlDialog,
    BlDisclosure,
    BlTabBarItem,
    BlTelemetry,
    BlTelemetryCell,
    BlToaster,
    useToast
  } from '../../vue'
  import { nextTick, onMounted, ref } from 'vue'

  import type { TableColumn } from '../../vue'

  const hash = 'e3b0c44298fc1c149afbf4c8996fb92427ae41e4649b934ca495991b7852b855'
  const url =
    'https://example.com/very/long/path/that/never/breaks/ever/and/keeps/going/forever/index.html'
  const german = 'Donaudampfschifffahrtsgesellschaftskapitaenspatent'
  // 39 words plus one unbroken 80-character token.
  const dialogTitle = `${'Rename '.repeat(39)}${'x'.repeat(80)}`
  const wideImage = `data:image/svg+xml;utf8,${encodeURIComponent(
    '<svg xmlns="http://www.w3.org/2000/svg" width="1200" height="60"><rect width="1200" height="60" fill="#888"/></svg>'
  )}`
  const twelve = Array.from({ length: 12 }, (_, i) => ({
    value: `o${i + 1}`,
    label: `Option ${i + 1}`
  }))

  const wideColumns = Array.from({ length: 9 }, (_, i) => ({
    key: `c${i + 1}`,
    label: `Column number ${i + 1} with a long label`,
    sortable: i < 2
  }))
  const wideRows = Array.from({ length: 6 }, (_, r) =>
    Object.fromEntries(
      wideColumns.map((c, i) => [
        c.key,
        i === 2 && r === 0 ? url.slice(0, 70) : i === 3 && r === 1 ? hash : `r${r + 1}c${i + 1}`
      ])
    )
  )
  const primaryColumns = wideColumns.map((c, i) => ({ ...c, primary: i === 3 }))
  const urlColumns: TableColumn<(typeof urlRows)[number]>[] = [
    { key: 'id', label: 'ID' },
    { key: 'url', label: 'URL' }
  ]
  const urlRows = [
    { id: 'a', url: 'https://example.com/' + 'x'.repeat(180) },
    { id: 'b', url: 'short' }
  ]
  const logColumns: TableColumn<(typeof logRows)[number]>[] = [
    { key: 'id', label: 'ID' },
    { key: 'level', label: 'Level' },
    { key: 'message', label: 'Message' }
  ]
  const logRows = [
    {
      id: 1,
      level: 'info',
      message: 'I (1203) wifi: ' + 'connected to the access point '.repeat(7).slice(0, 185)
    },
    { id: 2, level: 'warn', message: 'short message' }
  ]
  const footerColumns: TableColumn<(typeof footerRows)[number]>[] = [
    { key: 'name', label: 'Name', total: 'count' },
    { key: 'a', label: 'Alpha', numeric: true, total: 'sum' },
    { key: 'b', label: 'Beta', numeric: true, total: 'avg' },
    { key: 'c', label: 'Gamma', numeric: true }
  ]
  const sort4Columns: TableColumn<(typeof footerRows)[number]>[] = [
    { key: 'name', label: 'Name', sortable: true },
    { key: 'a', label: 'Alpha', numeric: true, sortable: true },
    { key: 'b', label: 'Beta', numeric: true, sortable: true },
    { key: 'c', label: 'Gamma', numeric: true, sortable: true }
  ]
  const footerRows = Array.from({ length: 4 }, (_, i) => ({
    name: `Row ${i + 1}`,
    a: 10 * (i + 1),
    b: 3.5 * (i + 1),
    c: 100 + i
  }))

  const words = [
    'Tokens',
    'Controls',
    'Readouts',
    'Lists',
    'Archive',
    'Changelog',
    'Guides',
    'Reference',
    'Examples',
    'Roadmap',
    'Support',
    'About'
  ]
  const links = (n: number) => words.slice(0, n)

  interface Chrome {
    bar: boolean
    brand: string
    links: number
    tabs: string[]
    logo?: boolean
  }
  const tab = (n: number) => Array.from({ length: n }, (_, i) => `Tab ${i + 1}`)
  const brand = 'BENCHLIGHT'
  const chromeDefs: Record<string, Chrome> = {
    'sitebar-4': { bar: true, brand, links: 4, tabs: [] },
    'sitebar-6': { bar: true, brand, links: 6, tabs: [] },
    'sitebar-8': { bar: true, brand, links: 8, tabs: [] },
    'sitebar-12': { bar: true, brand, links: 12, tabs: [] },
    'sitebar-brand-30': { bar: true, brand: 'B'.repeat(30), links: 0, tabs: [] },
    'sitebar-brand-30-nav': { bar: true, brand: 'B'.repeat(30), links: 4, tabs: [] },
    'sitebar-logo': { bar: true, brand, links: 4, tabs: [], logo: true },
    'sitebar-nav-no-tabs': { bar: true, brand, links: 4, tabs: [] },
    'tab-bar-6': { bar: true, brand, links: 4, tabs: tab(6) },
    'tab-bar-7': { bar: true, brand, links: 4, tabs: tab(7) },
    'tab-bar-long-4': {
      bar: true,
      brand,
      links: 4,
      tabs: ['Konfiguration', 'Einstellungen', 'Verwaltung', 'Übersichtsseite']
    }
  }
  const chromeCases = Object.keys(chromeDefs)
  const eqActive = ref(false)
  const marqueeText = ref('Just a little too long for the box')

  const only = new URLSearchParams(location.search).get('case')
  const chrome = only ? (chromeDefs[only] ?? null) : null
  const show = (id: string) => !chrome && (!only || only === id)

  // Six persistent toasts; the long ones come first so they are among the visible three.
  const { toast } = useToast()
  const sheetOpen = ref(false)
  const detailsOpen = ref(false)
  const formDialog = ref<HTMLDialogElement>()
  function save(): void {
    sheetOpen.value = false
    toast('Saved')
  }
  const sheetLog = ref<string[]>([])
  // Close and reopen in one task, before the browser's async close event.
  async function reopen(): Promise<void> {
    sheetOpen.value = false
    await nextTick()
    sheetOpen.value = true
  }

  onMounted(() => {
    if (!show('toast-six')) return
    toast({ message: `https://example.com/${'x'.repeat(130)}`, duration: 0 })
    toast({ message: 'Item deleted', action: { label: 'Undo', onClick: () => {} }, duration: 0 })
    for (let n = 3; n <= 6; n++) toast({ message: `Toast ${n}`, duration: 0 })
  })
</script>

<style>
  .st-main {
    padding-block: 16px 96px;
  }
  .st-label {
    margin: 24px 0 8px;
    font-family: var(--bl-font-mono);
    font-size: 11px;
    font-weight: 500;
    letter-spacing: 0.1em;
    color: var(--bl-ink-3);
  }
  .st-filler {
    padding-block: 8px;
  }
</style>
