FROM mcr.microsoft.com/dotnet/sdk:10.0 AS build
WORKDIR /src
COPY OroTrack.slnx ./
COPY backend/OroTrack.Domain/*.csproj backend/OroTrack.Domain/
COPY backend/OroTrack.Infrastructure/*.csproj backend/OroTrack.Infrastructure/
COPY backend/OroTrack.Api/*.csproj backend/OroTrack.Api/
RUN dotnet restore backend/OroTrack.Api/OroTrack.Api.csproj
COPY backend/ backend/
RUN dotnet publish backend/OroTrack.Api/OroTrack.Api.csproj -c Release -o /app

FROM mcr.microsoft.com/dotnet/aspnet:10.0 AS runtime
WORKDIR /app
COPY --from=build /app .
EXPOSE 8080
ENV ASPNETCORE_URLS=http://+:8080
ENTRYPOINT ["dotnet", "OroTrack.Api.dll"]
