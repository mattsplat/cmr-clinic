<template>
    <div>
        <div
                v-if="global_error_message"
                class="alert alert-danger"
                role="alert"
        >
            {{ global_error_message }}
        </div>
        <div
                v-if="server_message !== false"
                class="alert alert-danger"
                role="alert"
        >
            {{ this.server_message }}
            <a v-if="try_logging_in" href="/login">Login</a>
        </div>
        <!-- Grid Actions Top -->
        <div class="grid-top row mb-0 align-items-center">
            <div class="col-lg-8 mb-2">
                <form class="form-inline mb-0">
                    <a
                            href="#"
                            @click.default="goToNew"
                            class="btn btn-primary mb-3 mb-sm-2 mr-3"
                    >Add</a
                    >
                    <search-form-group
                            class="mb-0"
                            :errors="form_errors.keyword"
                            label="Search"
                    >
                        <input
                                name="query"
                                id="grid-filter-query-copy"
                                v-model="query"
                                @keyup="getData(1)"
                                class="form-control mb-2"
                                type="text"
                                placeholder="Name search"
                                aria-label="Name search"
                        />
                    </search-form-group>
                </form>
            </div>
            <div class="col-lg-4 text-lg-right mb-2"></div>
        </div>
        <!-- end Grid Actions Top -->

        <!-- Grid -->
        <div class="grid no-more-tables table-responsive mb-4">
            <table class="table table-striped table-hover mb-0">
                <thead>
                <tr>
                    <ss-grid-column-header
                            v-on:selectedSort="sortColumn"
                            v-bind:selectedKey="sortKey"
                            title="Sort by Full Name"
                            :params="{
                                sortField: 'name',
                                InitialSortOrder: 'asc'
                            }"
                    >
                        Full Name
                    </ss-grid-column-header>
                    <ss-grid-column-header
                            v-on:selectedSort="sortColumn"
                            v-bind:selectedKey="sortKey"
                            title="Sort by Date of Birth"
                            :params="{
                                sortField: 'dob',
                                InitialSortOrder: 'asc'
                            }"
                    >
                        DOB
                    </ss-grid-column-header>
                    <ss-grid-column-header
                            v-on:selectedSort="sortColumn"
                            v-bind:selectedKey="sortKey"
                            title="Sort by Notes"
                            :params="{
                                sortField: 'notes',
                                InitialSortOrder: 'asc'
                            }"
                    >
                        Notes
                    </ss-grid-column-header>
                    <th colspan="3" class="text-center">Actions</th>
                </tr>
                </thead>
                <tbody>
                <tr v-if="gridState == 'wait'">
                    <td colspan="6" class="grid-alert">
                        <div class="alert alert-info" role="alert">
                            Please wait.
                        </div>
                    </td>
                </tr>
                <tr v-if="gridState == 'error'">
                    <td colspan="6" class="grid-alert">
                        <div class="alert alert-warning" role="alert">
                            Error please try again.
                        </div>
                    </td>
                </tr>

                <tr v-if="gridState == 'good' && !gridData.length">
                    <td colspan="6" class="grid-alert">
                        <div class="alert alert-warning" role="alert">
                            No matching records found.
                        </div>
                    </td>
                </tr>

                <tr v-else v-for="row in this.gridData" :key="row.id">
                    <td data-title="Full Name" style="width: 25%">{{ row.name }}</td>
                    <td data-title="Date of Birth" style="width: 15%">{{ row.dob }}</td>
                    <td data-title="Notes">{{ row.notes }}</td>
                    <td style="width: 5%"><a @click="edit(row.id)">Edit</a></td>
                    <td style="width: 5%"><a @click="view(row.id)">View</a></td>
                    <td style="width: 5%"><a @click="form(row.id)">Form</a></td>
                </tr>
                </tbody>
            </table>
        </div>
        <!-- end Grid -->

        <!-- Grid Actions Bottom -->
        <div class="grid-bottom row mb-0 align-items-center">
            <div class="col-lg-4 mb-2">
                <a href="/client/download" class="btn btn-primary mb-2 mr-2"
                >Export to Excel</a
                >
                <a href="/client/print" class="btn btn-primary mb-2 mr-2"
                >Print PDF</a
                >
            </div>
            <ss-grid-pagination
                    class="col-lg-4 mb-2"
                    v-bind:current_page="current_page"
                    v-bind:last_page="last_page"
                    v-bind:total="total"
                    v-on:goto-page="getData(...arguments)"
            >
            </ss-grid-pagination>
            <ss-grid-pagination-location
                    class="col-lg-4 text-lg-right mb-2"
                    v-bind:current_page="current_page"
                    v-bind:last_page="last_page"
                    v-bind:total="total"
            >
            </ss-grid-pagination-location>
        </div>
        <!-- end Grid Actions Bottom -->
    </div>
</template>

<script>
    import SsGridColumnHeader from "./SsGridColumnHeader";
    import SsGridPagination from "./SsGridPagination";
    import SsGridPaginationLocation from "./SsPaginationLocation";
    import SearchFormGroup from "./SearchFormGroup";

    export default {
        name: "client-grid",
        components: {
            SsGridColumnHeader,
            SsGridPaginationLocation,
            SsGridPagination,
            SearchFormGroup
        },
        props: {
            params: {
                type: Object,
                default: function () {
                }
            }
        },

        mounted: function () {
            this.params.Page = !isNaN(parseInt(this.params.Page))
                ? parseInt(this.params.Page)
                : null;
            this.query = this.params.Search;
            this.current_page = this.params.Page;
            this.getData(1);
        },

        data: function () {
            return {
                gridState: "wait",
                query: this.params.Search,
                gridData: [],
                current_page: this.params.Page,
                last_page: null,
                total: null,

                sortOrder: this.params.sortOrder,
                sortKey: this.params.sortKey,

                global_error_message: null,

                form_errors: {
                    page: false,
                    keyword: false,
                    column: false,
                    direction: false
                },
                server_message: false,
                try_logging_in: false
            };
        },

        methods: {
            goToNew: function () {
                window.location.href = "/client/create";
            },

            sortColumn: function (obj) {
                this.sortKey = obj.sortField;
                this.sortOrder = obj.sortOrder;
                this.getData(1);
            },

            getData: async function (new_page_number) {
                this.global_error_message = null;

                let getPage;

                getPage =
                    this.getDataUrl(new_page_number) +
                    "&column=" +
                    this.sortKey +
                    "&direction=" +
                    this.sortOrder;

                this.gridData = [];
                this.gridState = "wait";

                if (getPage != null) {
                    // We have a filter
                    await this.$axios.get(getPage)
                        .then(response => {
                            if (response.status === 200) {
                                Object.keys(this.form_errors).forEach(
                                    i => (this.form_errors[i] = false)
                                );
                                this.gridData = response.data.data;
                                this.total = response.data.total;
                                this.current_page = response.data.current_page;
                                this.last_page = response.data.last_page || 1;
                            } else {
                                this.server_message = res.status;
                            }
                            this.gridState = "good";
                        })
                        .catch(error => {
                            if (error.response) {
                                this.gridState = "error";
                                if (error.response.status === 422) {
                                    // Clear errors out
                                    Object.keys(this.form_errors).forEach(
                                        i => (this.form_errors[i] = false)
                                    );
                                    // Set current errors
                                    Object.keys(error.response.data.errors).forEach(
                                        i =>
                                            (this.form_errors[i] =
                                                error.response.data.errors[i])
                                    );
                                } else if (error.response.status === 404) {
                                    // Record not found
                                    this.server_message = "Record not found";
                                    window.location = "/client";
                                } else if (error.response.status === 419) {
                                    // Unknown status
                                    this.server_message =
                                        "Unknown Status, please try to ";
                                    this.try_logging_in = true;
                                } else if (error.response.status === 500) {
                                    // Unknown status
                                    this.server_message =
                                        "Server Error, please try to ";
                                    this.try_logging_in = true;
                                } else {
                                    this.server_message =
                                        error.response.data.message;
                                }
                            } else {
                                console.log(error.response);
                                this.server_message = error;
                            }
                        });
                }
            },

            getDataUrl: function (new_page_number) {
                var url = "api-client?";
                url = this.$store.state.apiUrlPrefix + '/clients/v1.0.0?';
                var queryParams = [];

                queryParams.push("page=" + new_page_number);

                if (this.isDefined(this.query) && this.query.trim().length > 0)
                    queryParams.push("keyword=" + this.query);

                //                if (this.isDefined(this.searchType)) queryParams.push('search_type=' + this.searchType);
                //                if (this.isDefined(this.showFilter)) queryParams.push('show_filter=' + this.showFilter);
                //                if (this.isDefined(this.contractorSelected)) queryParams.push('contractor_id=' + this.contractorSelected);

                if (queryParams.length > 0) url += queryParams.join("&");

                return url;
            },
            goToNew() {
                this.$router.push('/add-client')
            },
            edit(client_id) {
                console.log('edit');
                console.log(client_id);
                // this.$store.dispatch('clearAll');
                this.$store.dispatch('getClient', client_id);

                this.$store.dispatch('getClientConvictions', client_id);

                this.$router.push('/intake')
            },
            view(client_id) {
                console.log(client_id);
                // this.$store.dispatch('clearAll');
                this.$store.dispatch('getClient', client_id);

                this.$store.dispatch('getClientConvictions', client_id);

                this.$router.push('/view-client')
            },
            form(client_id) {
                console.log(client_id);
                // this.$store.dispatch('clearAll');
                this.$store.dispatch('getClient', client_id);

                this.$store.dispatch('getClientConvictions', client_id);

                this.$router.push('/pro-se-form')
            }

        }
    };
</script>
